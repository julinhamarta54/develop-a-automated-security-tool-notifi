import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';

interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  timestamp: string;
}

class AutomatedSecurityNotifier {
  private readonly notifierEmail: string;
  private readonly notifyList: string[];
  private readonly securityDataPath: string;

  constructor(notifierEmail: string, notifyList: string[], securityDataPath: string) {
    this.notifierEmail = notifierEmail;
    this.notifyList = notifyList;
    this.securityDataPath = securityDataPath;
  }

  async loadSecurityData(): Promise<SecurityAlert[]> {
    const data = await fs.promises.readFile(this.securityDataPath, 'utf8');
    return JSON.parse(data) as SecurityAlert[];
  }

  async sendNotification(alert: SecurityAlert) {
    const transporter = nodemailer.createTransport({
      host: 'your-email-host',
      port: 587,
      secure: false, // or 'STARTTLS'
      auth: {
        user: this.notifierEmail,
        pass: 'your-email-password',
      },
    });

    const mailOptions = {
      from: this.notifierEmail,
      to: this.notifyList.join(','),
      subject: `Security Alert: ${alert.title}`,
      text: `Security Alert: ${alert.title}\n${alert.description}`,
    };

    await transporter.sendMail(mailOptions);
  }

  async monitorSecurityData() {
    const securityData = await this.loadSecurityData();

    for (const alert of securityData) {
      if (alert.severity === 'HIGH') {
        await this.sendNotification(alert);
      }
    }
  }

  async init() {
    await this.monitorSecurityData();

    // Schedule the monitoring to run every 1 minute
    setInterval(async () => {
      await this.monitorSecurityData();
    }, 60 * 1000);
  }
}

const notifier = new AutomatedSecurityNotifier(
  'your-notifier-email@example.com',
  ['recipient1@example.com', 'recipient2@example.com'],
  path.join(__dirname, './security_data.json')
);

notifier.init();