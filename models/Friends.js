module.exports = (sequelize, DataTypes) => {
    const Friends = sequelize.define('Friends'
    , {
      UserId: DataTypes.UUID,
      FriendId: DataTypes.UUID,
      status: DataTypes.STRING,
    }
    );
    return Friends;
  };