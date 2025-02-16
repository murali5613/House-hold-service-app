import smtplib as SMTP
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = 'localhost'
SMTP_PORT = 1025
SENDER_EMAIL = 'murali@iitm.ac.in'
SENDER_PASSWORD = 'Murali@123'


def send_message(to, subject, content_body):
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = to
    msg['Subject'] = subject
    msg.attach(MIMEText(content_body, 'html'))
    client = SMTP.SMTP(host=SMTP_HOST, port=SMTP_PORT)
    client.send_message(msg=msg)
    client.quit()
    