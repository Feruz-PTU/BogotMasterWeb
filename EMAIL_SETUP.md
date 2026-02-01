# 📧 EmailJS Setup Guide

Your website is now ready to send emails! Follow these steps to configure EmailJS (takes 5 minutes).

## 🚀 Quick Setup Steps

### 1. Create EmailJS Account
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" (it's FREE - 200 emails/month)
3. Verify your email

---

### 2. Add Email Service
1. Go to **Email Services** tab
2. Click "Add New Service"
3. Choose your email provider (Gmail recommended):
   - **Gmail**: Click "Connect Account" and authorize
   - **Or use SMTP** with any email
4. Copy the **Service ID** (looks like: `service_xyz123`)

---

### 3. Create Email Templates

#### **Template 1: Contact Form**
1. Go to **Email Templates** tab
2. Click "Create New Template"
3. **Template Name**: `Contact Form`
4. **Template Content**:
   ```
   Subject: Новое сообщение с сайта от {{from_name}}
   
   From: {{from_name}}
   Email: {{from_email}}
   
   Message:
   {{message}}
   ```
5. Copy the **Template ID** (looks like: `template_abc123`)

#### **Template 2: Price Inquiry**
1. Create another new template
2. **Template Name**: `Price Inquiry`
3. **Template Content**:
   ```
   Subject: Запрос цены: {{product_name}}
   
   Клиент: {{from_name}}
   Телефон: {{phone}}
   Email: {{from_email}}
   
   Продукт: {{product_name}}
   Количество: {{quantity}}
   
   Комментарий:
   {{message}}
   ```
4. Copy the **Template ID**

---

### 4. Get Public Key
1. Go to **Account** tab
2. Find **Public Key** section
3. Copy your public key (looks like: `abcXYZ123456789`)

---

### 5. Configure Your Website

Open `/src/services/emailService.js` and replace:

```javascript
const EMAIL_CONFIG = {
    serviceId: 'YOUR_SERVICE_ID',              // ← Paste your Service ID
    contactTemplateId: 'YOUR_CONTACT_TEMPLATE_ID',  // ← Paste Contact Template ID
    priceTemplateId: 'YOUR_PRICE_TEMPLATE_ID',      // ← Paste Price Template ID
    publicKey: 'YOUR_PUBLIC_KEY'               // ← Paste your Public Key
};
```

**Example:**
```javascript
const EMAIL_CONFIG = {
    serviceId: 'service_xyz123',
    contactTemplateId: 'template_abc456',
    priceTemplateId: 'template_def789',
    publicKey: 'abcXYZ123456789'
};
```

---

## ✅ Test Your Setup

1. Save the file
2. Run `npm run dev`
3. Fill out the contact form and submit
4. Check your email inbox!

---

## 📋 EmailJS Dashboard Overview

Your EmailJS dashboard shows:
- **Email History**: See all sent emails
- **Usage Stats**: Track your monthly quota (200 free)
- **Template Editor**: Edit email templates anytime

---

## 🔧 Troubleshooting

### "Email not sent" error?
- ✅ Check all IDs are correctly copied (no typos)
- ✅ Verify email service is connected
- ✅ Check browser console for specific errors

### Template variables not working?
- ✅ Make sure variable names match exactly (case-sensitive)
- ✅ Use double curly braces: `{{variable_name}}`

### Gmail blocked the connection?
- ✅ Enable "Less secure app access" in Gmail settings
- ✅ Or use Gmail's "App Password" feature

---

## 💡 Pro Tips

1. **Test emails** go to spam sometimes - check spam folder
2. **Customize** email templates with your logo/branding
3. **Set up auto-replies** in EmailJS template settings
4. **Upgrade** to paid plan ($0.40/100 emails) if you need more

---

## 🎯 Current Email Flow

### Contact Form → Email
```
Customer fills form
     ↓
EmailJS sends email to your inbox
     ↓
Success message shown to customer
```

### Price Inquiry → Email
```
Customer clicks "Узнать цену"
     ↓
Fills modal form
     ↓
EmailJS sends product inquiry to you
     ↓
Success message + modal closes
```

---

## 🌐 Alternative: If EmailJS Doesn't Work

You can also use:
- **Formspree** (50 submissions/month free)
- **Web3Forms** (250 submissions/month free)
- **Custom backend** (requires server setup)

Need help? Just ask!
