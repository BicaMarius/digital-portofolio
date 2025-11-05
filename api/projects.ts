import { projects } from '../shared/schema.js';
import { createCrudHandler } from './shared-api/crud-handler.js';

export default createCrudHandler(projects);
