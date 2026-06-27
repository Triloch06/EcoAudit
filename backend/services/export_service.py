import io
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

def generate_excel(logs) -> io.BytesIO:
    wb = Workbook()
    ws = wb.active
    ws.title = "Waste Logs"
    
    # Headers
    headers = ["ID", "Category", "Weight (kg)", "Latitude", "Longitude", "Accuracy (m)", "Date & Time"]
    ws.append(headers)
    
    # Data
    for log in logs:
        ws.append([
            str(log.id),
            log.category,
            log.weight,
            log.latitude,
            log.longitude,
            log.accuracy,
            log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else ""
        ])
        
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return stream

def generate_pdf(logs) -> io.BytesIO:
    stream = io.BytesIO()
    doc = SimpleDocTemplate(stream, pagesize=letter)
    elements = []
    
    styles = getSampleStyleSheet()
    title = Paragraph("EcoAudit - Waste Logs Report", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))
    
    # Table data
    data = [["Category", "Weight (kg)", "Date & Time"]]
    for log in logs:
        data.append([
            log.category,
            f"{log.weight:.2f}",
            log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else ""
        ])
        
    t = Table(data)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.grey),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,0), 12),
        ('BACKGROUND', (0,1), (-1,-1), colors.beige),
        ('GRID', (0,0), (-1,-1), 1, colors.black)
    ]))
    
    elements.append(t)
    doc.build(elements)
    
    stream.seek(0)
    return stream
