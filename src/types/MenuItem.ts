export interface MenuItemType {
  id: number
  name: string
  description: string
  price: number
  image: string
  // Bilingual fields for API
  name_th?: string
  name_en?: string
}