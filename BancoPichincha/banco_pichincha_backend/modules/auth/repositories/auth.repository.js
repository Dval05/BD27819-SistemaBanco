const { supabase } = require('../../../shared/config/database.config');

class AuthRepository {
  async findByUsuario(usuario) {
    const { data, error } = await supabase
      .from('persona')
      .select('*')
      .eq('per_usuario', usuario)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findById(id) {
    const { data, error } = await supabase
      .from('persona')
      .select('*')
      .eq('id_persona', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async findPersonaNatural(idPersona) {
    const { data, error } = await supabase
      .from('persona_natural')
      .select('*')
      .eq('id_persona', idPersona)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findPersonaJuridica(idPersona) {
    const { data, error } = await supabase
      .from('persona_juridica')
      .select('*')
      .eq('id_persona', idPersona)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(persona) {
    const { data, error } = await supabase
      .from('persona')
      .insert(persona)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async createPersonaNatural(personaNatural) {
    const { data, error } = await supabase
      .from('persona_natural')
      .insert(personaNatural)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async findByCedula(cedula) {
    const { data, error } = await supabase
      .from('persona_natural')
      .select('*')
      .eq('id_pernat', cedula)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updatePassword(id, passwordHash) {
    const { data, error } = await supabase
      .from('persona')
      .update({ per_contrasenia: passwordHash })
      .eq('id_persona', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

module.exports = new AuthRepository();
