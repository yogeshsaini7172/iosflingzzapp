// Utility to apply all comprehensive fixes
export async function applyAllFixes() {
  try {
    console.log('🔧 Applying comprehensive fixes...');
    
    // Call the fix-data-consistency function
    const response = await fetch('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/fix-data-consistency', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      throw new Error(`Fix function failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Comprehensive fixes applied:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Error applying fixes:', error);
    throw error;
  }
}

// Auto-run fixes on import for immediate effect
applyAllFixes();