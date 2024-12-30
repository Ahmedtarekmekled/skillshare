import mongoose from 'mongoose'

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
}, {
  timestamps: true,
})

export default mongoose.models.Post || mongoose.model('Post', PostSchema)
