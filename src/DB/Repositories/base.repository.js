
export default class BaseRepository {



constructor(model) {
    this.model = model;
}

    createNewDocument(data) {
        return this.model.create(data)
    }


    findDocumentById(_id){
        return this.model.findById(_id)
        
    }


    findOneDocument(filters){
        return this.model.findOne(filters)
    }


    findOneAndUpdateDocument( filters , updates , options){
        return this.model.findOneAndUpdate(filters , updates , options)
    }


    findAllDocument(filters = {}, { select, sort, limit, skip } = {}) {
    let query = this.model.find(filters);
    if (select) query = query.select(select);
    if (sort) query = query.sort(sort);
    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);
    return query;
}

findByIdAndDeleteDocument(_id) {
    return this.model.findByIdAndDelete(_id);
}

updateDocumentById(_id, data, options) {
    return this.model.findByIdAndUpdate(_id, data, options);
}

updateOneDocument(filters, data, options) {
    return this.model.findOneAndUpdate( filters, data, options);
}
}