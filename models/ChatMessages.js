module.exports = (sequelize, DataTypes) => {

    const ChatMessages = sequelize.define("ChatMessages", {
        message: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        media: {
            type: DataTypes.STRING,
            allowNull: true,
        }

    })

    ChatMessages.associate = (models) => {
        ChatMessages.belongsTo(models.Users, {
            foreignKey: "UserId",
            onDelete: "cascade"
        });
        ChatMessages.belongsTo(models.ChatRoom, {
            foreignKey: "ChatRoomId",
            onDelete: "cascade"
        });
    }
    return ChatMessages;
}
