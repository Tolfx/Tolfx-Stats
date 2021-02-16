/**
 * 
 * @param {Document} model 
 * @param {Boolean} setheader 
 */
module.exports = function pagination(model, setheader) {
    return async (req, res, next) => {
        const page = parseInt(req.query.page);
        const limit = 1000;
        const startIndex = (page -1) * limit;
        const endIndex = page * limit;

        const result = {};

        if(endIndex < await model.countDocuments().exec()) {
            result.next = {
                page: page + 1,
                limit: limit
            }
        }

        if(startIndex > 0) {
            result.previous = {
                page: page - 1,
                limit: limit
            }
        }
        try {
            result.result = await model.find().sort([['date', 1]]).limit(limit).skip(startIndex).exec()
            if(setheader) {
                res.paginatedPage = result
                next()
            } else {
                return result
            }
            
        } catch (err) {
            res.status(500)
        }
    }
}