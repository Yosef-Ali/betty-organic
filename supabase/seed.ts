import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function seedDatabase() {
  // Create admin user
  const { data: user, error: userError } = await supabase.auth.signUp({
    email: 'yosethio@yahoo.com',
    password: 'StrongP@ssw0rd123!',
  });

  if (userError) throw userError;
  console.log('Admin user created:', user);

  // Seed categories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .insert([
      {
        name: 'Fruits',
        description: 'Fresh and organic fruits',
        icon: '🍎'
      },
      {
        name: 'Vegetables',
        description: 'Locally grown vegetables',
        icon: '🥕'
      }
    ])
    .select()

  if (catError) throw catError

  // Seed products
  const { data: products, error: prodError } = await supabase
    .from('products')
    .insert([
      {
        name: 'Organic Apples',
        description: 'Fresh organic apples',
        price: 2.99,
        stock: 100,
        imageUrl: '/fruits/apples.jpg',
        totalSales: 0
      },
      {
        name: 'Organic Carrots',
        description: 'Fresh organic carrots',
        price: 1.99,
        stock: 150,
        imageUrl: '/fruits/carrots.jpg',
        totalSales: 0
      }
    ])
    .select()

  if (prodError) throw prodError

  // Seed customers
  const { data: customers, error: custError } = await supabase
    .from('customers')
    .insert([
      {
        full_name: 'John Doe',
        email: 'john@example.com',
        status: 'active',
        phone: '+1234567890',
        location: 'New York'
      },
      {
        full_name: 'Jane Smith',
        email: 'jane@example.com',
        status: 'active',
        phone: '+0987654321',
        location: 'Los Angeles'
      }
    ])
    .select()

  if (custError) throw custError

  // Seed orders
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .insert([
      {
        customer_id: customers[0].id,
        status: 'completed',
        total_amount: 29.90,
        type: 'online'
      },
      {
        customer_id: customers[1].id,
        status: 'pending',
        total_amount: 19.90,
        type: 'in-store'
      }
    ])
    .select()

  if (orderError) throw orderError

  // Seed order items
  await supabase
    .from('order_item')
    .insert([
      {
        order_id: orders[0].id,
        product_id: products[0].id,
        price: products[0].price,
        quantity: 5
      },
      {
        order_id: orders[1].id,
        product_id: products[1].id,
        price: products[1].price,
        quantity: 10
      }
    ])

  // Seed knowledge base
  await supabase
    .from('knowledge_base')
    .insert([
      {
        question: 'What are your delivery options?',
        response: 'We offer both standard and express delivery.',
        suggestions: ['delivery', 'shipping', 'options'],
        links: ['/delivery-info', '/faq']
      }
    ])

  console.log('Database seeded successfully!')
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding database:', error)
    process.exit(1)
  })
