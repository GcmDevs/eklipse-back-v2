import { EntityStatusFilter } from "../enums";

export class FindThrowOptions {
  throwIfNotFound: boolean = true;
}

export type EntityStatusQuery = {
  estado?: EntityStatusFilter;
  estadoHijos?: EntityStatusFilter;
};