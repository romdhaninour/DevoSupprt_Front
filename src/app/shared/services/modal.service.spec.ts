import { TestBed } from '@angular/core/testing';
import { ModalService } from './modal.service';

describe('ModalService', () => {
  let service: ModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ModalService]
    });
    service = TestBed.inject(ModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to closed', () => {
    expect(service.isOpen).toBe(false);
  });

  it('should open the modal', () => {
    service.openModal();
    expect(service.isOpen).toBe(true);
  });

  it('should close the modal', () => {
    service.openModal();
    service.closeModal();
    expect(service.isOpen).toBe(false);
  });

  it('should toggle the modal from closed to open', () => {
    service.toggleModal();
    expect(service.isOpen).toBe(true);
  });

  it('should toggle the modal from open to closed', () => {
    service.openModal();
    service.toggleModal();
    expect(service.isOpen).toBe(false);
  });

  it('should emit isOpen$ observable changes', () => {
    const values: boolean[] = [];
    service.isOpen$.subscribe(v => values.push(v));

    service.openModal();
    service.closeModal();
    service.toggleModal();

    expect(values).toEqual([false, true, false, true]);
  });

  it('should return current value synchronously via isOpen getter', () => {
    expect(service.isOpen).toBe(false);
    service.openModal();
    expect(service.isOpen).toBe(true);
    service.closeModal();
    expect(service.isOpen).toBe(false);
  });

  it('should handle multiple rapid toggles', () => {
    service.toggleModal();
    service.toggleModal();
    service.toggleModal();
    expect(service.isOpen).toBe(true);
  });
});
