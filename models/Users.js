module.exports = (sequelize, DataTypes) => {

    const Users =  sequelize.define("Users", {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        userInformation: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isLoggedIn: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
        },
        userStatus: {
            type: DataTypes.STRING,
            defaultValue: "offline",
            allowNull: false,
        }
    })

    Users.associate = (models) => {
        Users.hasMany(models.Comments, {
            foreignKey: "UserId",
            onDelete: "cascade"
        })
        Users.hasMany(models.Posts, {
            foreignKey: "UserId",
            onDelete: "cascade"
        })
        Users.hasMany(models.Likes, {
            foreignKey: "UserId",
            onDelete: "cascade"
        })

        Users.hasMany(models.ChatUsers, {
            foreignKey: "UserId",
            onDelete: "cascade"
        })
        Users.hasMany(models.ChatMessages, {
            foreignKey: "UserId",
            onDelete: "cascade"
        })

        Users.belongsToMany(models.Users, { 
            as: 'userFriends',
            foreignKey: 'UserId',
            through: "friends"
        });

        Users.belongsToMany(models.Users, { 
            as: 'friendsOf',
            foreignKey: 'FriendId',
            through: "friends"
        });

    }
    return Users;
}
