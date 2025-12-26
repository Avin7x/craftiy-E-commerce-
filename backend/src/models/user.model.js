import mongoose from "mongoose";
import bcrypt from  "bcryptjs"
const userSchema = mongoose.Schema({
    name: {
        type:String,
        required:true
    },
    email: {
        type:String,
        required: [true, "Email is  required"],
        unique: true,
        lowercase:true,
        trim:true
    },
    password: {
        type:String,
        required: [true, "Password is required"],
        minLength:[6,"Password must be atleast 6 characters long"]
    },
    cartItems: [
        {
            quantity: {
                type: Number,
                default: 1
            },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "product"
            }
        }
    ],
    role: {
        type: String,
        enum: ["customer", "admin"],
        default: "customer"
    }
},{timestamps:true});



// pre-save hook to hash password
userSchema.pre("save", async function() {
  if (!this.isModified("password")) return;//if password is not new or modifed return
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

//john 123456
//john  1234567 -> invalid  credentials

userSchema.methods.comparePassword = async function (password)  {
    return bcrypt.compare(password, this.password);
}

const User = mongoose.model("User", userSchema);
export default User;