// src/bikes/dto/bike-response.dto.ts
export class BikeResponseDto {
  _id: string;
  name: string;
  model?: string;
  year?: number;
  price?: number;
  description?: string;
  photos?: string[];
  stockQuantity: number;
  availability: string; // computed
}
