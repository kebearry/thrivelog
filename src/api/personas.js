import { supabase } from '../supabaseClient';

export const createPersona = async (personaData) => {
  try {
    const { data, error } = await supabase
      .from('personas')
      .insert([personaData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating persona:', error);
    throw error;
  }
};

export const getPersonas = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Handle table not found error gracefully
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        console.log('Personas table does not exist yet, returning empty array');
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (error) {
    // If it's a table not found error, return empty array instead of throwing
    if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
      console.log('Personas table does not exist yet, returning empty array');
      return [];
    }
    console.error('Error fetching personas:', error);
    throw error;
  }
};

export const updatePersona = async (personaId, updates) => {
  try {
    const { data, error } = await supabase
      .from('personas')
      .update(updates)
      .eq('id', personaId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating persona:', error);
    throw error;
  }
};

export const deletePersona = async (personaId) => {
  try {
    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', personaId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting persona:', error);
    throw error;
  }
};

export const getPersonaById = async (personaId) => {
  try {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('id', personaId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching persona:', error);
    throw error;
  }
};
