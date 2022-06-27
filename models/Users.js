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
    }
    return Users;
}