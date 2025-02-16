from celery import shared_task
from .models import ServiceRequest, User
from datetime import datetime
from .mail_service import send_message
from .models import RolesUsers, Role
import os
import csv

@shared_task(ignore_result=False)
def create_resource_csv():
    try:
        # Get only completed service requests
        service_requests = ServiceRequest.query.filter(
            ServiceRequest.service_status == 'completed'
        ).all()
        
        # Prepare data for excel
        data = []
        for req in service_requests:
            # Get user emails
            customer = User.query.get(req.customer_id)
            professional = User.query.get(req.professional_id)
            
            row = {
                'service_id': req.service_id,
                'service_name': req.service_name,
                'customer_id': req.customer_id,
                'customer_email': customer.email if customer else 'Unknown',
                'professional_id': req.professional_id,
                'professional_email': professional.email if professional else 'Unknown',
                'date_of_request': req.date_of_request.strftime('%Y-%m-%d %H:%M:%S') if req.date_of_request else '',
                'date_of_completion': req.date_of_completion.strftime('%Y-%m-%d %H:%M:%S') if req.date_of_completion else '',
                'remarks': req.review if req.review else 'No remarks'
            }
            data.append(row)

        # Define column names
        column_names = [
            'service_id', 'service_name', 'customer_id', 'customer_email',
            'professional_id', 'professional_email', 'date_of_request', 
            'date_of_completion', 'remarks'
        ]

        # Ensure export directory exists
        export_dir = 'exports'
        if not os.path.exists(export_dir):
            os.makedirs(export_dir)

        # Create output file
        file_name = os.path.join(export_dir, f'completed_services_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv')
        
        # Create CSV file
        with open(file_name, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=column_names)
            writer.writeheader()
            writer.writerows(data)
        
        return file_name
        
    except Exception as e:
        print(f"Error in create_resource_csv: {str(e)}")
        raise


@shared_task(ignore_result=True)
def daily_reminder():
    # Get all professionals with pending requests
    professionals = User.query.join(RolesUsers).join(Role).filter(
        Role.name == 'professional',
        User.active == True  # Only active professionals
    ).all()
    
    for professional in professionals:
        try:
            # Get pending requests for this professional
            pending_requests = ServiceRequest.query.filter(
                ServiceRequest.professional_id == professional.id,
                ServiceRequest.service_status.in_(['pending', 'requested'])  # Check both statuses
            ).all()
            
            if pending_requests:  # Only send reminder if there are pending requests
                # Create HTML content for email
                html_content = f"""
                <html>
                    <body>
                        <h2>Daily Service Request Reminder</h2>
                        <p>Dear {professional.username},</p>
                        <p>You have {len(pending_requests)} pending service request(s) that require your attention:</p>
                        
                        <table border="1" style="border-collapse: collapse; width: 100%;">
                            <tr>
                                <th>Service Name</th>
                                <th>Request Date</th>
                                <th>Status</th>
                                <th>Customer ID</th>
                            </tr>
                """
                
                for request in pending_requests:
                    html_content += f"""
                            <tr>
                                <td>{request.service_name}</td>
                                <td>{request.date_of_request.strftime('%Y-%m-%d %H:%M')}</td>
                                <td>{request.service_status}</td>
                                <td>{request.customer_id}</td>
                            </tr>
                    """
                
                html_content += """
                        </table>
                        <p>Please login to your account to accept/reject these requests.</p>
                        <p>Thank you for your prompt attention to this matter.</p>
                    </body>
                </html>
                """
                
                # Send the reminder email
                send_message(
                    to=professional.email,
                    subject="Daily Reminder: Pending Service Requests",
                    content_body=html_content
                )
                
                print(f"Reminder sent to professional {professional.email}")
                
        except Exception as e:
            print(f"Error sending reminder to {professional.email}: {str(e)}")
            continue
    
    return "Daily reminders sent successfully"


@shared_task(ignore_result=True)
def customer_monthly_report():
    # Get all users with customer role
    customers = User.query.join(RolesUsers).join(Role).filter(Role.name == 'customer').all()
    
    for customer in customers:
        try:
            # Get ALL services for this customer (removed date filter)
            all_services = ServiceRequest.query.filter(
                ServiceRequest.customer_id == customer.id
            ).all()
            
            # Calculate statistics
            total_services = len(all_services)
            completed_services = sum(1 for s in all_services if s.service_status == 'completed')
            pending_services = sum(1 for s in all_services if s.service_status in ['requested', 'accepted'])
            
            # Create HTML report
            html_content = f"""
            <html>
                <body>
                    <h2>Service Report</h2>
                    <p>Dear {customer.username},</p>
                    
                    <h3>Summary:</h3>
                    <ul>
                        <li>Total Services Requested: {total_services}</li>
                        <li>Completed Services: {completed_services}</li>
                        <li>Pending Services: {pending_services}</li>
                    </ul>
                    
                    <h3>Detailed Service List:</h3>
                    <table border="1" style="border-collapse: collapse; width: 100%;">
                        <tr>
                            <th>Service Name</th>
                            <th>Date Requested</th>
                            <th>Status</th>
                            <th>Completion Date</th>
                            <th>Review</th>
                        </tr>
            """
            
            # Add each service to the report
            for service in all_services:
                html_content += f"""
                        <tr>
                            <td>{service.service_name}</td>
                            <td>{service.date_of_request.strftime('%Y-%m-%d')}</td>
                            <td>{service.service_status}</td>
                            <td>{service.date_of_completion.strftime('%Y-%m-%d') if service.date_of_completion else 'Pending'}</td>
                            <td>{service.review if service.review else 'No review'}</td>
                        </tr>
                """
            
            html_content += """
                    </table>
                    <br>
                    <p>Thank you for using our services!</p>
                </body>
            </html>
            """
            
            # Send email
            send_message(
                to=customer.email,
                subject=f"Complete Service Report - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                content_body=html_content
            )
            
            print(f"Report sent to {customer.email}")
            
        except Exception as e:
            print(f"Error sending report to {customer.email}: {str(e)}")
            continue
    
    return "Reports sent successfully"

# customer_monthly_report.delay()
# daily_reminder.delay()