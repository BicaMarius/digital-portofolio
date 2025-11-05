import { writings } from '../shared/schema.js';
import { createCrudHandler } from './_shared/crud-handler.js';

export default createCrudHandler(writings);
