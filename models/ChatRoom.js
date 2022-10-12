const { literal, fn } = require("sequelize");

module.exports = (sequelize, DataTypes) => {

    const ChatRoom = sequelize.define("ChatRoom")

    ChatRoom.associate = (models) => {
        // ChatRoom.belongsToMany(models.ChatRoom, {
        //     as: "members",
        //     foreignKey: "UserId",
        //     through: "ChatUsers"
        // });

        // ChatRoom.hasMany(models.ChatUsers, {
        //     foreignKey: "UserId",

        // })

        // ChatRoom.belongsToMany(models.ChatRoom, {
        //     as: "chatRoom",
        //     foreignKey: "UserId",
        //     through: "ChatUsers"
        // });
        ChatRoom.belongsToMany(models.Users, {
            as: "members",
            foreignKey: "ChatRoomId",
            through: "ChatUsers"
        });
        ChatRoom.hasMany(models.ChatMessages, {
            foreignKey: "ChatRoomId",
            onDelete: "cascade"
        });
        ChatRoom.hasMany(models.ChatUsers, {
            foreignKey: "UserId",
            onDelete: "cascade"
        })
    }
    return ChatRoom;
}
