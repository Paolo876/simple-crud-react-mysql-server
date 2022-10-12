module.exports = (sequelize, DataTypes) => {

    // const ChatUsers = sequelize.define("ChatUsers")
    const ChatUsers = sequelize.define("ChatUsers", {
        id: {type : DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
        isLastMessageRead: { type: DataTypes.BOOLEAN, allowNull: true }
    })
    // const ChatUsers = sequelize.define("ChatUsers", {
    //     memberId: DataTypes.UUID,
    //     // ChatRoomId: DataTypes.UUID,
    // })

    ChatUsers.associate = (models) => {
        ChatUsers.belongsTo(models.Users, {
            foreignKey: "UserId",
            onDelete: "cascade"
        });

        // ChatUsers.hasMany(models.ChatRoom, {
        //     foreignKey: "ChatRoomId",
        //     onDelete: "cascade"
        // })
        ChatUsers.belongsTo(models.ChatRoom, {
            foreignKey: "ChatRoomId",
            onDelete: "cascade"
        })
    }
    return ChatUsers;
}
