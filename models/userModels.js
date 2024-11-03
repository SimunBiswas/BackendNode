/* eslint-disable prettier/prettier */
const crypto = require('crypto')
const mongoose = require('mongoose');
const validator =  require('validator')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
    {
        name : {
            type : String,
            required : [true, 'Please tell us your name']
        },
        email : {
            type : String,
            required : [true, 'Please provide your email'],
            unique : true,
            lowercase : true,
            validate : [validator.isEmail , 'Please Provide a valid email']

        },
        photo : {
            type : String
        },

        role : {
            type : String,
            enum : ['user', 'guide', 'lead-guide', 'admin'],
            default : 'user',
        },

        password: {
            type : String,
            required : [true, 'Please provide your password'],
            minlength : 8,
            select : false
        },
        passwordConfirm : {
            type : String,
            required : [true, 'Please confirm your password'],  
            validate : {
                //This is only works on Create & SAVE
                validator : function(el) {
                    return el === this.password; // abc === abc
                },
                message : 'Passwords are not the same !'
            }
        },
        passwordChangedAt: Date,
        passwordResetExpiresIn : Date,
        passwordResetToken : String,
        active : {
            type : Boolean,
            default : true,
            select : false
        }
    }

)

userSchema.pre('save', async function(next) {

    // Only run this function if the password was modified
    if ( !this.isModified('password') ) return next();

    //Hash the password with  the cost 12
    this.password = await bcrypt.hash(this.password , 12)

    //Delete the password confirm field 
    this.passwordConfirm = undefined;
    this.passwordChangedAt = Date.now()
    next()
})

userSchema.pre('save', function(next) {
    console.log('Role before saving:', this.role); // Check role value before saving
    next();
});

userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew ) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
  
  });

userSchema.pre(/^find/,function(next) {
    this.find({active : { $ne : false }})
    next()
})

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {

        console.log(this.passwordChangedAt, JWTTimestamp)

        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        
        console.log(JWTTimestamp, changedTimestamp)

        return JWTTimestamp < changedTimestamp;
    }


    // False means the password was NOT changed after the JWT was issued
    return false;
};

userSchema.methods.createPasswordResetToken = function (){
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    console.log({resetToken}, this.passwordResetToken)

    this.passwordResetExpiresIn = Date.now() + 10 * 60 * 1000;
    console.log({resetToken}, this.passwordResetToken, this.passwordResetExpiresIn)


    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;