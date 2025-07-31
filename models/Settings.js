const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  branding: {
    logo: {
      type: String,
      default: null
    },
    primaryColor: {
      type: String,
      default: '#007bff'
    },
    secondaryColor: {
      type: String,
      default: '#6c757d'
    },
    fontFamily: {
      type: String,
      default: 'Roboto'
    }
  },
  dashboard: {
    customHtml: {
      type: String,
      default: '<h2>Welcome to our store!</h2><p>Browse our products and place your orders.</p>'
    }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getInstance = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);