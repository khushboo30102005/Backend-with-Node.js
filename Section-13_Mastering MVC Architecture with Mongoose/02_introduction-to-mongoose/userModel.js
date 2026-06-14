import { model, Schema } from 'mongoose';
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required, please enter the name'],
      minlength: [3, 'Name must be at least 3 characters long'],
      trim: true,
      index: true,
      // alias: 'nam'  //  creating a virtual
    },
    age: {
      type: Number,
      required: [true, 'Age is required, please enter the age'],
      min: 12,
      // Custom Validator: Validating Even Numbers
      validate: {
        validator() {
          // console.log('Running Custom Validator');
          // console.log(this);
          return this.age % 2 === 0;
        },
        message: 'age must be a even number',
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please enter a valid email',
      ],
      trim: true,
      lowercase: true,
    },
    balance: Number,
    hobbies: {
      type: [String],
    },
    password: {
      type: String,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      required: function () {
        return this.age < 16;
      },
      default: null,
      ref: 'User',
    },
  },
  {
    strict: 'throw',
    timestamps: true,
    optimisticConcurrency: true,  // enable versioning for normal properties, otherwise versioning enables only for arrays.
    // versionKey: false
    /*   virtuals: {
      isAdult: {
        get() {
          return this.age >= 18;
        },
      },
      getHobbies: {
        get() {
          return this.hobbies.join(', ');
        },
        set(value) {
          // this.hobbies.push(value)

          const newHobbies = value.split(', ');
          this.hobbies = [...this.hobbies, ...newHobbies];
        },
      },
    }, */
    /*  methods: {
      getSummary(option) {
        if (option === 'full')
          return `${this.name} is ${this.age} years old and Hobbies are ${this.hobbies.join(', ')}.`;
        return `${this.name} is ${this.age} years old.`;
      },
    }, */
    /*     statics: {
      findOneByName(name) {
        return this.findOne({ name });
      },
      findByEmail(email) {
        return this.findOne({ email });
      },
    }, */
    /*     toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    }, */
  },
);
// Another way of creating virtuals
/* userSchema.virtual('emailDomain').get(function () {
  return this.email.split('@')[1];
}); */

// userSchema.method.abc = function(){}
// userSchema.statics.xyz = function(){}

// middlewares:

/* // Document middleware:
userSchema.pre('save', function(){
  // console.log("Running my Document middleware with save!!")
  this.password = this.name+this.age
  // console.log(this)
})
userSchema.post('save', function(doc){
  console.log("your Account is created and your password is", this.password)
  console.log(doc)
  console.log(this)
}) */

/* // Query middleware:
userSchema.pre(/^find/, function(){
  this.find({age: {$gte: 50}}).select('-_id name age')
})
// userSchema.pre(['find','findOne'], function(){
//   this.find({age: {$gte: 50}}).select('-_id name age')
// })
userSchema.post('find', function(doc){
  console.log('hii')
  console.log(doc)
  // console.log(this)
}) */

/* // Model Middleware:

userSchema.pre('insertMany', function ( docs) {
  for(const doc of docs){
    doc.password = doc.name + doc.age
  }
  console.log(docs);
  console.log('Running MODEL middleware using insertMany')
}); */
const User = model('User', userSchema);

export default User;
