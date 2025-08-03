# 📧 Email Setup Guide

## 🎯 **Overview**
This guide explains how to set up email functionality for the registration approval system.

## 🔧 **Gmail Setup**

### **Step 1: Enable 2-Factor Authentication**
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

### **Step 2: Generate App Password**
1. Go to Google Account settings
2. Navigate to Security
3. Under "2-Step Verification", click "App passwords"
4. Select "Mail" and "Other (Custom name)"
5. Enter "Workshop Management System"
6. Copy the generated 16-character password

### **Step 3: Update Environment Variables**
Add these to your `.env` file:

```env
# Email Configuration
EMAIL_USER=grocerystore9437@gmail.com
EMAIL_PASS=your_16_character_app_password_here
FRONTEND_URL=http://localhost:3000
```

## 📧 **Email Flow**

### **Admin Registration Request:**
1. User submits admin registration request
2. Email sent to: `grocerystore9437@gmail.com`
3. System admin approves/rejects via email link
4. User receives approval/rejection notification

### **Club Member Registration Request:**
1. User submits member registration request
2. Email sent to: Club admin's email address
3. Club admin approves/rejects via email link
4. User receives approval/rejection notification

## 🧪 **Testing Email Setup**

### **Test Email Configuration:**
```javascript
// Add this to your server.js for testing
const { sendEmail } = require('./config/email');

// Test email
sendEmail('test@example.com', 'adminRequest', {
  username: 'testuser',
  email: 'test@example.com',
  clubCode: 'TEST123',
  requestId: 'test123'
}).then(result => {
  console.log('Email test result:', result);
});
```

## 🔒 **Security Notes**

- ✅ Use App Password, not regular password
- ✅ Keep `.env` file secure and never commit to git
- ✅ App passwords are 16 characters long
- ✅ Each app password is unique and secure

## 🐛 **Common Issues**

### **Issue 1: "Invalid login"**
- **Cause**: Using regular password instead of app password
- **Solution**: Generate and use app password

### **Issue 2: "Less secure app access"**
- **Cause**: 2FA not enabled
- **Solution**: Enable 2-Step Verification first

### **Issue 3: "Authentication failed"**
- **Cause**: Incorrect email or password
- **Solution**: Double-check email and app password

## ✅ **Success Indicators**

- ✅ App password generated successfully
- ✅ `.env` file updated with correct credentials
- ✅ Test email sends without errors
- ✅ Registration requests trigger emails
- ✅ Approval/rejection emails work

## 🎉 **Setup Complete!**

Once email is configured, the registration approval system will work automatically. 