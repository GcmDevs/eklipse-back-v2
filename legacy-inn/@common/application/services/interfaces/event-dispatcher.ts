import { DomainEventBase } from './domain-event.base';

export interface EventDispatcher {
  dispatch(events: DomainEventBase[]): Promise<void>;
}
