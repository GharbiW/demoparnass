
export type EmailTemplate = {
    id: string;
    name: string;
    description: string;
    subject: string;
    body: string; // HTML content
    category?: string;
};

export const emailTemplates: EmailTemplate[] = [
    {
        id: 'welcome-modern',
        name: 'Modern Welcome',
        description: 'Un email d\'accueil pour les nouveaux utilisateurs.',
        subject: "Welcome Aboard!",
        category: "Onboarding",
        body: `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#f4f4f4;font-family:sans-serif;"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 0;"><table role="presentation" style="width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);"><tr><td style="background-color:#4F46E5;padding:40px 0;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:28px;">Welcome Aboard!</h1></td></tr><tr><td style="padding:40px;"><p style="color:#333333;font-size:16px;line-height:24px;margin:0 0 20px;">Hi there,</p><p style="color:#555555;font-size:16px;line-height:24px;margin:0 0 20px;">Thanks for joining us. We're thrilled to have you. Here are a few steps to get you started on the right foot.</p><table role="presentation" style="width:100%;"><tr><td style="padding:15px;background-color:#F3F4F6;border-radius:6px;margin-bottom:10px;"><strong>1. Complete your profile</strong></td></tr><tr><td style="padding:15px;background-color:#F3F4F6;border-radius:6px;"><strong>2. Explore the dashboard</strong></td></tr></table><br><center><a href="#" style="background-color:#4F46E5;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:4px;font-weight:bold;display:inline-block;">Get Started</a></center></td></tr><tr><td style="background-color:#eeeeee;padding:20px;text-align:center;color:#888888;font-size:12px;"><p>&copy; 2023 Brand Name. All rights reserved.</p></td></tr></table></td></tr></table></body></html>`
    },
    {
        id: 'flash-sale',
        name: 'E-commerce Flash Sale',
        description: 'Annonce d\'une vente flash percutante.',
        subject: "50% OFF EVERYTHING - 24 Hours Only!",
        category: "Sales",
        body: `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#1a1a1a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:20px 0;"><table role="presentation" style="width:600px;background-color:#000000;border:1px solid #333;"><tr><td style="padding:0;"><img src="https://placehold.co/600x300/e63946/ffffff?text=FLASH+SALE" alt="Sale" style="width:100%;display:block;"></td></tr><tr><td style="padding:30px;text-align:center;"><h2 style="color:#ffffff;font-size:32px;margin:0 0 10px;text-transform:uppercase;letter-spacing:2px;">50% OFF EVERYTHING</h2><p style="color:#cccccc;font-size:16px;margin-bottom:30px;">The clock is ticking. This offer expires in 24 hours.</p><a href="#" style="background-color:#e63946;color:#ffffff;text-decoration:none;padding:16px 40px;font-size:18px;font-weight:bold;text-transform:uppercase;display:inline-block;">Shop Now</a></td></tr><tr><td style="padding:20px;background-color:#111;text-align:center;color:#666;font-size:12px;">Unsubscribe | View in Browser</td></tr></table></td></tr></table></body></html>`
    },
    {
        id: 'minimalist-newsletter',
        name: 'Minimalist Newsletter',
        description: 'Un template de newsletter épuré et élégant.',
        subject: "The Weekly Journal - Design Trends to Watch",
        category: "Content",
        body: `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#ffffff;font-family:Georgia, serif;"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center"><table role="presentation" style="width:600px;margin-top:40px;margin-bottom:40px;"><tr><td style="border-bottom:2px solid #000;padding-bottom:10px;text-align:left;"><h1 style="font-size:24px;margin:0;color:#000;">The Weekly Journal</h1><span style="font-size:12px;color:#666;">Issue #42 | November 2023</span></td></tr><tr><td style="padding:30px 0;"><h2 style="font-size:20px;margin-bottom:10px;color:#222;">Design Trends to Watch</h2><p style="font-size:16px;line-height:1.6;color:#444;">Minimalism isn't just about less; it's about enough. This week we explore how whitespace impacts conversion rates and user delight.</p><a href="#" style="color:#000;text-decoration:underline;font-weight:bold;">Read the full story &rarr;</a></td></tr><tr><td style="padding:20px 0;border-top:1px solid #eee;"><h2 style="font-size:20px;margin-bottom:10px;color:#222;">CSS Tricks You Missed</h2><p style="font-size:16px;line-height:1.6;color:#444;">Grid layout is powerful, but are you using it to its full potential? Here is a deep dive.</p><a href="#" style="color:#000;text-decoration:underline;font-weight:bold;">Continue reading &rarr;</a></td></tr><tr><td style="padding-top:40px;text-align:center;font-family:sans-serif;font-size:12px;color:#999;"><p>Sent with &hearts; by The Journal Team.</p></td></tr></table></td></tr></table></body></html>`
    },
    {
        id: 'order-receipt',
        name: 'Order Receipt',
        description: 'Confirmation de paiement claire et professionnelle.',
        subject: "Your Receipt for Pro Plan (Monthly)",
        category: "Transactional",
        body: `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 0;"><table role="presentation" style="width:500px;background-color:#ffffff;border-radius:12px;padding:40px;"><tr><td style="text-align:center;padding-bottom:20px;"><div style="width:60px;height:60px;background-color:#ecfdf5;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:10px;"><span style="color:#10b981;font-size:30px;">&#10003;</span></div><h2 style="margin:0;color:#1f2937;">Payment Successful</h2><p style="color:#6b7280;margin-top:5px;">Thanks for your purchase!</p></td></tr><tr><td style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;padding:20px 0;"><table style="width:100%;"><tr><td style="color:#4b5563;">Pro Plan (Monthly)</td><td style="text-align:right;font-weight:bold;color:#1f2937;">$29.00</td></tr><tr><td style="color:#4b5563;padding-top:5px;">Tax</td><td style="text-align:right;font-weight:bold;color:#1f2937;">$2.90</td></tr></table></td></tr><tr><td style="padding-top:15px;"><table style="width:100%;"><tr><td style="font-weight:bold;font-size:18px;color:#1f2937;">Total</td><td style="text-align:right;font-weight:bold;font-size:18px;color:#1f2937;">$31.90</td></tr></table></td></tr><tr><td style="padding-top:30px;text-align:center;"><a href="#" style="color:#3b82f6;text-decoration:none;font-size:14px;">Download Invoice PDF</a></td></tr></table></td></tr></table></body></html>`
    },
    {
        id: 'webinar-invitation',
        name: 'Webinar Invitation',
        description: 'Une invitation percutante pour un événement en ligne.',
        subject: "You're Invited: Mastering Email Marketing in 2024",
        category: "Events",
        body: `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#2e0249;font-family:Arial, sans-serif;"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 0;"><table role="presentation" style="width:600px;background-color:#570a57;background:linear-gradient(135deg, #570a57 0%, #2e0249 100%);border-radius:10px;color:#ffffff;"><tr><td style="padding:0;"><img src="https://placehold.co/600x250/a91079/ffffff?text=Live+Webinar" alt="Webinar" style="border-top-left-radius:10px;border-top-right-radius:10px;width:100%;"></td></tr><tr><td style="padding:40px;text-align:center;"><h3 style="color:#a91079;text-transform:uppercase;letter-spacing:1px;margin:0;">Free Masterclass</h3><h1 style="font-size:32px;margin:10px 0 20px;">Mastering Email Marketing in 2024</h1><p style="font-size:18px;color:#f0f0f0;line-height:1.5;">Join us for an exclusive deep dive into the strategies that are converting right now.</p><div style="background-color:rgba(255,255,255,0.1);padding:20px;border-radius:8px;margin:30px 0;display:inline-block;text-align:left;"><p style="margin:5px 0;">🗓 <strong>Date:</strong> Thursday, Oct 24</p><p style="margin:5px 0;">⏰ <strong>Time:</strong> 2:00 PM EST</p></div><br><a href="#" style="background-color:#f806cc;color:#ffffff;text-decoration:none;padding:15px 35px;border-radius:50px;font-weight:bold;font-size:16px;">Save My Spot</a></td></tr></table></td></tr></table></body></html>`
    },
    {
        id: 'app-notification',
        name: 'App Notification',
        description: 'Un email de notification simple et efficace.',
        subject: "New Comment on 'Q4 Design Goals'",
        category: "Product",
        body: `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#eff6ff;font-family:sans-serif;"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 0;"><table role="presentation" style="width:400px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);"><tr><td style="background-color:#3b82f6;height:8px;"></td></tr><tr><td style="padding:30px;text-align:center;"><div style="background-color:#dbeafe;width:64px;height:64px;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;"><span style="font-size:30px;">💬</span></div><h2 style="margin:0 0 10px;color:#1e3a8a;">New Comment</h2><p style="color:#64748b;margin:0 0 25px;line-height:1.5;"><strong>Sarah J.</strong> replied to your thread <em>"Q4 Design Goals"</em>.</p><a href="#" style="display:block;width:100%;background-color:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 0;border-radius:8px;font-weight:bold;">View Reply</a><a href="#" style="display:block;margin-top:15px;color:#94a3b8;text-decoration:none;font-size:13px;">Turn off these notifications</a></td></tr></table></td></tr></table></body></html>`
    },
    {
        id: 'customer-feedback',
        name: 'Customer Feedback',
        description: 'Un moyen simple de recueillir les avis clients.',
        subject: "How did we do?",
        category: "Feedback",
        body: `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#fff1f2;font-family:Helvetica, Arial, sans-serif;"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 0;"><table role="presentation" style="width:550px;background-color:#ffffff;border:1px solid #ffe4e6;border-radius:8px;"><tr><td style="padding:40px;text-align:center;"><h1 style="color:#be123c;margin:0 0 10px;">How did we do?</h1><p style="color:#444;margin-bottom:30px;">We'd love to hear about your recent experience with our support team.</p><table role="presentation" align="center"><tr><td style="padding:0 5px;"><a href="#" style="text-decoration:none;font-size:30px;">😠</a></td><td style="padding:0 5px;"><a href="#" style="text-decoration:none;font-size:30px;">🙁</a></td><td style="padding:0 5px;"><a href="#" style="text-decoration:none;font-size:30px;">😐</a></td><td style="padding:0 5px;"><a href="#" style="text-decoration:none;font-size:30px;">🙂</a></td><td style="padding:0 5px;"><a href="#" style="text-decoration:none;font-size:30px;">😍</a></td></tr></table><p style="color:#888;font-size:12px;margin-top:30px;">It only takes 10 seconds!</p></td></tr></table></td></tr></table></body></html>`
    },
    {
        id: 'password-reset',
        name: 'Password Reset',
        description: 'Un email de réinitialisation de mot de passe sécurisé.',
        subject: "Reset Your Password",
        category: "Security",
        body: `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#f9fafb;font-family:sans-serif;"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:50px 0;"><table role="presentation" style="width:450px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:4px;"><tr><td style="padding:40px;text-align:center;"><img src="https://img.icons8.com/ios-filled/100/374151/lock.png" width="50" style="margin-bottom:20px;"><h2 style="color:#111827;margin:0 0 15px;">Reset Your Password</h2><p style="color:#6b7280;line-height:1.5;margin-bottom:25px;">We received a request to reset your password. Click the button below to create a new one.</p><a href="#" style="background-color:#111827;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:4px;font-weight:bold;display:inline-block;">Reset Password</a><p style="color:#9ca3af;font-size:12px;margin-top:25px;">If you didn't request this, please ignore this email.</p></td></tr></table></td></tr></table></body></html>`
    },
    {
        id: 'b2b-cold-outreach',
        name: 'B2B Cold Outreach',
        description: 'Un email de prospection B2B direct et concis.',
        subject: "Partnership Opportunity",
        category: "Business",
        body: `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#ffffff;font-family:'Courier New', Courier, monospace;"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:20px;"><table role="presentation" style="width:600px;text-align:left;"><tr><td style="padding:20px;border:1px solid #ddd;background-color:#fffff0;"><p style="font-size:14px;color:#333;"><strong>Subject:</strong> Partnership Opportunity</p><hr style="border:0;border-top:1px dashed #bbb;margin:20px 0;"><p style="font-size:14px;color:#333;line-height:1.6;">Hi [Name],</p><p style="font-size:14px;color:#333;line-height:1.6;">I've been following [Company] for a while, and I noticed you're expanding into [Region].</p><p style="font-size:14px;color:#333;line-height:1.6;">We help companies like yours streamline logistics by 20%. No fluff, just results.</p><p style="font-size:14px;color:#333;line-height:1.6;">Are you open to a 10-min chat next Tuesday?</p><p style="font-size:14px;color:#333;line-height:1.6;">Best,<br>John Doe<br>CEO, LogisticsInc</p></td></tr></table></td></tr></table></body></html>`
    },
    {
        id: 'seasonal-holiday',
        name: 'Seasonal / Holiday',
        description: 'Un template festif pour les occasions spéciales.',
        subject: "Happy Holidays from the Team!",
        category: "Seasonal",
        body: `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#164e63;font-family:serif;"><table role="presentation" style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 0;"><table role="presentation" style="width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;"><tr><td style="background-color:#0891b2;padding:40px;text-align:center;background-image:url('https://www.transparenttextures.com/patterns/snow.png');"><h1 style="color:#ffffff;font-size:36px;margin:0;">Happy Holidays!</h1></td></tr><tr><td style="padding:40px;text-align:center;"><p style="font-size:18px;color:#333;line-height:1.6;">From our family to yours, we wish you a season filled with warmth, joy, and code.</p><p style="font-size:16px;color:#555;margin-top:20px;">As a gift, here is a $20 voucher for your next purchase.</p><div style="margin-top:30px;border:2px dashed #0891b2;padding:15px;display:inline-block;color:#0891b2;font-weight:bold;font-size:20px;">CODE: HOLIDAY20</div></td></tr><tr><td style="background-color:#ecfeff;padding:15px;text-align:center;color:#155e75;font-size:12px;">Warm wishes from the Team.</td></tr></table></td></tr></table></body></html>`
    }
];

    