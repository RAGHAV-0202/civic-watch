// updateCategories.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rwcfboelkcxbhzoczgyt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Y2Zib2Vsa2N4Ymh6b2N6Z3l0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDA1NDM2MCwiZXhwIjoyMDY5NjMwMzYwfQ.5BT-fn5esswpYEc4bqYZi5_zQB7m_VTtX6O7ZYD3yCk'
const supabase = createClient(supabaseUrl, supabaseKey)

const newCategories = [
  {
    name: 'Roads',
    description: 'Potholes, road obstructions, damaged surfaces'
  },
  {
    name: 'Lighting',
    description: 'Broken or flickering street lights'
  },
  {
    name: 'Water Supply',
    description: 'Leaks, low pressure, water quality issues'
  },
  {
    name: 'Cleanliness',
    description: 'Overflowing bins, garbage collection issues'
  },
  {
    name: 'Public Safety',
    description: 'Open manholes, exposed wiring, safety hazards'
  },
  {
    name: 'Obstructions',
    description: 'Fallen trees, debris blocking paths'
  }
]

async function updateCategories() {
  try {
    // Clear existing categories
    const { error: deleteError } = await supabase
      .from('crime_categories')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.error('Error deleting categories:', deleteError)
      return
    }

    // Insert new categories
    const { data, error } = await supabase
      .from('crime_categories')
      .insert(newCategories)
      .select()

    if (error) {
      console.error('Error inserting categories:', error)
    } else {
      console.log('Categories updated successfully:', data)
    }
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

updateCategories()