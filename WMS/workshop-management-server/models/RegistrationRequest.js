const mongoose = require('mongoose');

const RegistrationRequestSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  roles: [{ 
    type: String, 
    enum: ['admin', 'clubMember'], 
    required: true 
  }],
  clubCode: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  requestType: { 
    type: String, 
    enum: ['admin', 'member'], 
    required: true 
  },
  // For admin requests - sent to system admin
  systemAdminEmail: { 
    type: String, 
    default: 'grocerystore9437@gmail.com' 
  },
  // For member requests - sent to club admin
  clubAdminEmail: { 
    type: String 
  },
  // Approval details
  approvedBy: { 
    type: String 
  },
  approvedAt: { 
    type: Date 
  },
  rejectionReason: { 
    type: String 
  },
  // Email tracking
  emailSent: { 
    type: Boolean, 
    default: false 
  },
  emailSentAt: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Index for efficient queries
RegistrationRequestSchema.index({ status: 1, requestType: 1 });
RegistrationRequestSchema.index({ clubCode: 1, role: 1 });

module.exports = mongoose.model('RegistrationRequest', RegistrationRequestSchema); 