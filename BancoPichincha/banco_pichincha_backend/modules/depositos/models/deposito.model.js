const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Deposito = sequelize.define('Deposito', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    cuenta_id: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'cuenta_id'
    },
    monto: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    estado: {
      type: DataTypes.STRING,
      defaultValue: 'PENDIENTE'
    }
  }, {
    tableName: 'deposito',
    timestamps: false
  });

  return Deposito;
};