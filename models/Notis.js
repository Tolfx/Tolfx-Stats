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

    width: {
        type: Number,
        default: 200
    },

    height: {
        type: Number,
        default: 200
    },

    author: {
        type: String,
        required: true
    },

    color: {
        type: String,
        required: true,
    },

    active: {
        type: Boolean,
        default: true
    },

    closed: {
        type: Boolean,
        default: false
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

NotisSchema.pre('validate', function (next) {
    


    if (this.information) {
        if(!this.information.includes("<script>")) {
            this.informationSani = dompurify.sanitize(marked(this.information));
        } else {
            this.informationSani = this.information;
        }
    }
  
    next();
});

const Notis = mongoose.model('notis', NotisSchema);

module.exports = Notis;