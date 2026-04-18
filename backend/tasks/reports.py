# backend/tasks/reports.py
import os
import io
from datetime import datetime, timedelta
from tasks.celery_app import celery
from app.db import queries
from app.config import settings


def build_pdf(summary: dict, vehicles: list, alerts: list, drivers: list) -> bytes:
    """Generate a PDF report using ReportLab."""
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    teal = colors.HexColor('#0d9488')
    dark = colors.HexColor('#1e293b')
    gray = colors.HexColor('#64748b')
    light = colors.HexColor('#f1f5f9')
    red = colors.HexColor('#ef4444')
    orange = colors.HexColor('#f59e0b')

    title_style = ParagraphStyle(
        'Title', parent=styles['Title'],
        fontSize=22, textColor=teal, spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        'Subtitle', parent=styles['Normal'],
        fontSize=10, textColor=gray, spaceAfter=20,
    )
    section_style = ParagraphStyle(
        'Section', parent=styles['Heading2'],
        fontSize=13, textColor=dark, spaceBefore=16, spaceAfter=8,
    )
    normal = styles['Normal']

    story = []

    # ── Header ──
    story.append(Paragraph("FleetPulse Daily Report", title_style))
    story.append(Paragraph(
        f"Generated: {datetime.now().strftime('%d %B %Y, %I:%M %p IST')}",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=teal, spaceAfter=16))

    # ── Summary Cards ──
    story.append(Paragraph("Fleet Summary", section_style))
    summary_data = [
        ['Metric', 'Value'],
        ['Total Vehicles', str(summary['total_vehicles'])],
        ['Total Drivers', str(summary['total_drivers'])],
        ['Total Alerts Today', str(summary['total_alerts_today'])],
        ['Unresolved Alerts', str(summary['unresolved_alerts'])],
        ['Active Vehicles', str(summary.get('active_vehicles', 0))],
        ['Avg Fuel Level', f"{summary.get('avg_fuel', 0):.1f}%"],
    ]
    summary_table = Table(summary_data, colWidths=[10*cm, 6*cm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), teal),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 11),
        ('BACKGROUND', (0,1), (-1,-1), light),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light]),
        ('FONTSIZE', (0,1), (-1,-1), 10),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (1,0), (1,-1), 'CENTER'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 0.5*cm))

    # ── Vehicle Status ──
    story.append(Paragraph("Vehicle Status", section_style))
    vehicle_data = [['Vehicle ID', 'Registration', 'Type', 'Driver', 'Status', 'Fuel']]
    for v in vehicles[:15]:
        fuel = v.get('fuel_level', 'N/A')
        fuel_str = f"{fuel}%" if fuel != 'N/A' else 'N/A'
        vehicle_data.append([
            v.get('vehicle_id', ''),
            v.get('registration', ''),
            v.get('type', ''),
            v.get('driver_id', ''),
            v.get('status', 'unknown'),
            fuel_str,
        ])

    vehicle_table = Table(vehicle_data, colWidths=[3*cm, 3.5*cm, 2*cm, 2.5*cm, 2.5*cm, 2.5*cm])
    vehicle_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), dark),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(vehicle_table)
    story.append(Spacer(1, 0.5*cm))

    # ── Active Alerts ──
    unresolved = [a for a in alerts if not a.get('resolved')]
    if unresolved:
        story.append(Paragraph(f"Active Alerts ({len(unresolved)})", section_style))
        alert_data = [['Vehicle', 'Type', 'Severity', 'Time']]
        for a in unresolved[:10]:
            alert_data.append([
                a.get('vehicle_id', ''),
                a.get('alert_type', ''),
                a.get('severity', ''),
                a.get('timestamp', '')[:16] if a.get('timestamp') else '',
            ])
        alert_table = Table(alert_data, colWidths=[4*cm, 5*cm, 3*cm, 4*cm])
        alert_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), red),
            ('TEXTCOLOR', (0,0), (-1,0), colors.white),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 9),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#fef2f2')]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#fecaca')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ]))
        story.append(alert_table)
        story.append(Spacer(1, 0.5*cm))

    # ── Driver Leaderboard ──
    story.append(Paragraph("Driver Performance", section_style))
    driver_data = [['Driver ID', 'Name', 'Safety Score', 'Total Trips']]
    for d in sorted(drivers, key=lambda x: float(x.get('safety_score', 0)), reverse=True)[:10]:
        driver_data.append([
            d.get('driver_id', ''),
            d.get('name', ''),
            str(d.get('safety_score', 'N/A')),
            str(d.get('total_trips', 0)),
        ])
    driver_table = Table(driver_data, colWidths=[3*cm, 6*cm, 4*cm, 3*cm])
    driver_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), teal),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, light]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(driver_table)

    # ── Footer ──
    story.append(Spacer(1, cm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=gray))
    story.append(Paragraph(
        "FleetPulse — Real-Time Fleet Intelligence Platform | Confidential",
        ParagraphStyle('Footer', parent=normal, fontSize=8, textColor=gray, alignment=1)
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()


def upload_to_s3(pdf_bytes: bytes, filename: str) -> str:
    """Upload PDF to S3/LocalStack. Returns S3 URL."""
    import boto3
    kwargs = {}
    if settings.use_localstack:
        kwargs = {
            'endpoint_url': settings.localstack_endpoint,
            'aws_access_key_id': 'test',
            'aws_secret_access_key': 'test',
        }
    s3 = boto3.client('s3', region_name=settings.aws_region, **kwargs)
    bucket = 'fleetpulse-reports'

    # Create bucket if not exists
    try:
        if settings.use_localstack:
            s3.create_bucket(Bucket=bucket)
        else:
            s3.create_bucket(
                Bucket=bucket,
                CreateBucketConfiguration={'LocationConstraint': settings.aws_region}
            )
    except Exception as e:
        if 'BucketAlreadyOwnedByYou' not in str(e) and 'BucketAlreadyExists' not in str(e):
            print(f"[Report] Bucket creation: {e}")

    s3.put_object(
        Bucket=bucket,
        Key=f"reports/{filename}",
        Body=pdf_bytes,
        ContentType='application/pdf',
    )
    url = f"{settings.localstack_endpoint}/{bucket}/reports/{filename}"
    print(f"[Report] Uploaded to S3: {url}")
    return url


def send_email_report(pdf_bytes: bytes, filename: str, recipient: str):
    """Send PDF report via email (prints in dev, SES in prod)."""
    if settings.use_localstack or not recipient:
        print(f"[Report] DEV MODE — would send {filename} to {recipient}")
        return

    try:
        import boto3
        ses = boto3.client('ses', region_name=settings.aws_region)
        from email.mime.multipart import MIMEMultipart
        from email.mime.base import MIMEBase
        from email.mime.text import MIMEText
        from email import encoders

        msg = MIMEMultipart()
        msg['Subject'] = f"FleetPulse Daily Report — {datetime.now().strftime('%d %B %Y')}"
        msg['From'] = 'reports@fleetpulse.in'
        msg['To'] = recipient

        body = MIMEText(
            f"Please find attached the daily fleet report for {datetime.now().strftime('%d %B %Y')}.\n\n"
            "This report includes vehicle status, active alerts, and driver performance.\n\n"
            "— FleetPulse Team"
        )
        msg.attach(body)

        attachment = MIMEBase('application', 'pdf')
        attachment.set_payload(pdf_bytes)
        encoders.encode_base64(attachment)
        attachment.add_header('Content-Disposition', f'attachment; filename="{filename}"')
        msg.attach(attachment)

        ses.send_raw_email(
            Source='reports@fleetpulse.in',
            Destinations=[recipient],
            RawMessage={'Data': msg.as_string()},
        )
        print(f"[Report] Email sent to {recipient}")
    except Exception as e:
        print(f"[Report] Email failed: {e}")


@celery.task(name="tasks.reports.generate_daily_report")
def generate_daily_report():
    """
    Runs every night at 11PM via Celery Beat.
    Generates PDF report → uploads to S3 → emails to fleet owner.
    """
    print("[Report] Starting daily report generation...")

    vehicles = queries.get_all_vehicles()
    drivers = queries.get_all_drivers()
    alerts = queries.get_all_alerts(active_only=False)

    # Compute summary stats
    active = [v for v in vehicles if v.get('status') == 'active']
    fuel_levels = []
    for v in vehicles:
        try:
            fuel_levels.append(float(v.get('fuel_level', 0)))
        except (ValueError, TypeError):
            pass

    summary = {
        'total_vehicles': len(vehicles),
        'total_drivers': len(drivers),
        'total_alerts_today': len(alerts),
        'unresolved_alerts': len([a for a in alerts if not a.get('resolved')]),
        'active_vehicles': len(active),
        'avg_fuel': sum(fuel_levels) / len(fuel_levels) if fuel_levels else 0,
    }

    print(f"[Report] Summary: {summary}")

    # Generate PDF
    try:
        pdf_bytes = build_pdf(summary, vehicles, alerts, drivers)
        filename = f"fleet-report-{datetime.now().strftime('%Y-%m-%d')}.pdf"
        print(f"[Report] PDF generated: {len(pdf_bytes)} bytes")
        # Save locally for download
        reports_dir = os.path.join(os.path.dirname(__file__), '..', 'reports')
        os.makedirs(reports_dir, exist_ok=True)
        local_path = os.path.join(reports_dir, filename)
        with open(local_path, 'wb') as f:
            f.write(pdf_bytes)
        print(f"[Report] Saved locally: {local_path}")
    except Exception as e:
        print(f"[Report] PDF generation failed: {e}")
        return summary

    # Upload to S3
    try:
        s3_url = upload_to_s3(pdf_bytes, filename)
    except Exception as e:
        print(f"[Report] S3 upload failed: {e}")
        s3_url = None

    # Get email from settings
    try:
        import boto3
        kwargs = {}
        if settings.use_localstack:
            kwargs = {
                'endpoint_url': settings.localstack_endpoint,
                'aws_access_key_id': 'test',
                'aws_secret_access_key': 'test',
            }
        db = boto3.resource('dynamodb', region_name=settings.aws_region, **kwargs)
        table = db.Table('AgentConfig')
        resp = table.scan()
        recipient = ''
        for item in resp.get('Items', []):
            email = item.get('notifications', {}).get('email', '')
            if email:
                recipient = email
                break
        send_email_report(pdf_bytes, filename, recipient)
    except Exception as e:
        print(f"[Report] Could not fetch email settings: {e}")

    return {**summary, 's3_url': s3_url, 'filename': filename}


@celery.task(name="tasks.reports.generate_report_now")
def generate_report_now():
    """Trigger report generation immediately (for testing)."""
    return generate_daily_report()