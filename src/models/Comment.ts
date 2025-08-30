import mongoose, { Schema, InferSchemaType } from 'mongoose';

const commentSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true, maxlength: 2000 }
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: -1 });

export type CommentSchema = InferSchemaType<typeof commentSchema>;
export type CommentDocument = mongoose.HydratedDocument<CommentSchema>;

const Comment = mongoose.model<CommentSchema>('Comment', commentSchema);
export default Comment;
