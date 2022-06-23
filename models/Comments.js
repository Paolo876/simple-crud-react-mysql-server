// each file on this folder represents a model of the table and its columns (sequelize)

module.exports = (sequelize, DataTypes) => {

    const Comments =  sequelize.define("Comments", {
        comment: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },

    )

    // create association between comments - user (belongsTo creates a UserId column on Comments table)
    Comments.associate = (models) => {
        Comments.belongsTo(models.Users, {
            foreignKey: "UserId",

        })
    }

    return Comments;
}