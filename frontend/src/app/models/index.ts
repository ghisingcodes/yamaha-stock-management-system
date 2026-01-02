// Example interface for Bike (you can do the same for Part)
interface Bike {
  _id: string;
  name: string;
  model?: string;
  year?: number;
  price?: number;
  description?: string;
  photos?: string[];           // Array of image URLs
  parts?: any[];
}
