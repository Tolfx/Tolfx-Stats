const mongoose = require('mongoose');
const marked = require('marked');
const createDomPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const dompurify = createDomPurify(new JSDOM().window);

const NotisSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    information: {
        type: String,
        required: true,
    },

    informationSani: {
        type: String,
        required: true,
    },

    posX: {
        type: Number,
        default: 0
    },

    posY: {
        type: Number,
        default: 0
    },

    author: {
        type: String,
        required: true
    },

    color: {
        type: String,
        required: true,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

NotisSchema.pre('validate', function (next) {
  
    if (this.information) {
      this.informationSani = dompurify.sanitize(marked(this.information));
    }
  
    next();
});

const Notis = mongoose.model('notis', NotisSchema);

module.exports = Notis;