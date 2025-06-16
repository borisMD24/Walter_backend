import HueHelper from "../helpers/hueHelper.js";
import BaseModel from "./baseModel.js";
import HueBulbModel from "./hueBulbModel.js";
import Color from "../classes/color.js";

class RoomModel extends BaseModel {
  static get tableName() {
    return "rooms";
  }
  static get relationMappings() {
    return {
      bulbs: {
        relation: BaseModel.HasManyRelation,
        modelClass: () => HueBulbModel,
        join: {
          from: "rooms.id",
          to: "hue_bulbs.room",
        },
      },
    };
  }
  static get jsonSchema() {
    return {
      type: "object",
      required: ["name"],
      properties: {
        id: { type: "integer" },
        name: { type: "string", minLength: 1, maxLength: 255 },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
      },
    };
  }

  // Debug method to check model setup
  static debugModel() {
    const debug = this.debugKnexBinding();
    console.log("HueBulbModel debug info:", {
      ...debug,
      schema: this.jsonSchema,
    });
    return debug;
  }
}

export default RoomModel;
