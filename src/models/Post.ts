import mongoose, { Schema, InferSchemaType } from 'mongoose';

const postSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }
  },
  { timestamps: true }
);

postSchema.index({ title: 'text', content: 'text' });
postSchema.index({ author: 1, createdAt: -1 });

export type PostSchema = InferSchemaType<typeof postSchema>;
export type PostDocument = mongoose.HydratedDocument<PostSchema>;

const Post = mongoose.model<PostSchema>('Post', postSchema);
export default Post;
