import { query } from '../config/database';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    console.log('Seeding initial data...');

    // 1. Create Default Admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    await query(`
      INSERT INTO users (username, password_hash, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', hashedPassword, 'admin']);

    // 2. Clear existing menu items and categories
    await query('TRUNCATE TABLE order_items CASCADE');
    await query('TRUNCATE TABLE orders CASCADE');
    await query('TRUNCATE TABLE products CASCADE');
    await query('TRUNCATE TABLE categories CASCADE');

    // 3. Insert Categories
    const catQuery = `
      INSERT INTO categories (key, name_th, name_en, sort_order) 
      VALUES ($1, $2, $3, $4) RETURNING id, key
    `;
    const coffeeRes = await query(catQuery, ['coffee', 'กาแฟ', 'Coffee', 1]);
    const teaRes = await query(catQuery, ['tea', 'ชา & สมูทตี้', 'Tea & Smoothies', 2]);
    const foodRes = await query(catQuery, ['food', 'อาหาร', 'Food', 3]);
    const dessertRes = await query(catQuery, ['dessert', 'ของหวาน', 'Desserts', 4]);

    const catMap = {
      coffee: coffeeRes.rows[0].id,
      tea: teaRes.rows[0].id,
      food: foodRes.rows[0].id,
      dessert: dessertRes.rows[0].id,
    };

    // 4. Insert Products
    const prodQuery = `
      INSERT INTO products (category_id, name_th, name_en, description_th, description_en, price, image_url, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    const products = [
      // Coffee
      [catMap.coffee, 'เอสเพรสโซ่ร้อน', 'Hot Espresso', 'ช็อตกาแฟเข้มข้น', 'A concentrated coffee shot', 50, '/images/assets/espresso.jpg', 1],
      [catMap.coffee, 'อเมริกาโน่เย็น', 'Iced Americano', 'กาแฟดำเย็น', 'Iced black coffee', 60, '/images/assets/americano.jpg', 2],
      [catMap.coffee, 'ลาเต้ร้อน', 'Hot Latte', 'กาแฟใส่นมร้อนนุ่มๆ', 'Smooth hot coffee with milk', 65, '/images/assets/latte.jpg', 3],
      [catMap.coffee, 'คาปูชิโน่เย็น', 'Iced Cappuccino', 'กาแฟนมเย็นท็อปด้วยฟองนม', 'Iced milk coffee topped with foam', 70, '/images/assets/cappuccino.jpg', 4],
      
      // Tea / Smoothies
      [catMap.tea, 'ชาไทยเย็น', 'Iced Thai Tea', 'คลาสสิกชาไทยใส่นม', 'Classic Thai milk tea', 60, '/images/assets/thaitea.jpg', 1],
      [catMap.tea, 'ชาเขียวมัทฉะเย็น', 'Iced Matcha Green Tea', 'มัทฉะแท้จากญี่ปุ่น', 'Authentic Japanese matcha', 75, '/images/assets/matcha.jpg', 2],
      [catMap.tea, 'สมูทตี้สตรอว์เบอร์รี', 'Strawberry Smoothie', 'สตรอว์เบอร์รีปั่นสดชื่น', 'Refreshing blended strawberries', 80, '/images/assets/strawberry.jpg', 3],
      
      // Food
      [catMap.food, 'ข้าวกะเพราหมูสับไข่ดาว', 'Basil Minced Pork with Fried Egg', 'รสจัดจ้านแบบฉบับไทย', 'Spicy Thai basil pork with egg', 79, '/images/assets/krapow.jpg', 1],
      [catMap.food, 'สปาเก็ตตี้คาโบนาร่า', 'Spaghetti Carbonara', 'ครีมซอสเบคอนชีสหนำใจ', 'Creamy bacon and cheese sauce', 120, '/images/assets/carbonara.jpg', 2],
      [catMap.food, 'คลับแซนด์วิช', 'Club Sandwich', 'ขนมปังปิ้งไส้แฮมชีสผักสด', 'Toast layer with ham, cheese, and veggies', 90, '/images/assets/club_sandwich.jpg', 3],
      
      // Dessert
      [catMap.dessert, 'บราวนี่เนื้อฟัดจ์', 'Fudge Brownie', 'ช็อกโกแลตเข้มข้นเนื้อหนึบ', 'Chewy dark chocolate brownie', 65, '/images/assets/brownie.jpg', 1],
      [catMap.dessert, 'ชีสเค้กหน้าไหม้', 'Basque Burnt Cheesecake', 'ครีมชีสเนื้อนุ่มหน้าไหม้หอมกรุ่น', 'Soft cream cheese with caramelized top', 110, '/images/assets/cheesecake.jpg', 2],
      [catMap.dessert, 'ครอฟเฟิล', 'Croffle', 'ความกรอบของครัวซองต์ในรูปแบบวาฟเฟิล', 'Croissant in a waffle form', 75, '/images/assets/croffle.jpg', 3],
    ];

    for (let p of products) {
      await query(prodQuery, p);
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedDatabase();
