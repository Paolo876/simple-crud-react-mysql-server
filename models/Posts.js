// each file on this folder represents a model of the table and its columns (sequelize)

module.exports = (sequelize, DataTypes) => {

    const Posts = sequelize.define("Posts", 
        {
            title: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            postText: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            postData: {
                type: DataTypes.STRING,
                allowNull: true,
            }

        },

    )

    // establish an association with the 'Comments' table  --this will create a 'Postid' column in the 'Comments' table
    Posts.associate = (models) => {
        Posts.hasMany(models.Comments, {
            foreignKey: "PostId",
            onDelete: "cascade"
        });
        Posts.hasMany(models.Likes, {
            foreignKey: "PostId",
            onDelete: "cascade"
        });

        Posts.belongsTo(models.Users, {
            foreignKey: "UserId",
            onDelete: "cascade"
        });
    }
    return Posts;
}
