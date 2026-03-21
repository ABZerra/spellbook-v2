import { useEffect, useRef, useState } from 'react';
import { CharacterProfile } from '../types';
import { formatClassDisplayString } from '../domain/character';

interface CharacterDropdownProps {
  characters: CharacterProfile[];
  activeCharacterId: string | null;
  onSelectCharacter: (id: string) => void;
  onCreateNew: () => void;
}

export function CharacterDropdown({
  characters,
  activeCharacterId,
  onSelectCharacter,
  onCreateNew,
}: CharacterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCharacter = characters.find((c) => c.id === activeCharacterId) ?? null;

  // Total items: characters + "New Character" action
  const totalItems = characters.length + 1;

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Reset focused index when dropdown closes
  useEffect(() => {
    if (!open) setFocusedIndex(-1);
  }, [open]);

  function handleButtonKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        setOpen((prev) => !prev);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!open) {
          setOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex((prev) => Math.min(prev + 1, totalItems - 1));
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (open) {
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
        }
        break;
    }
  }

  function handleItemKeyDown(event: React.KeyboardEvent, index: number) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (index < characters.length) {
          onSelectCharacter(characters[index].id);
          setOpen(false);
        } else {
          onCreateNew();
          setOpen(false);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex((prev) => Math.min(prev + 1, totalItems - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex((prev) => Math.max(prev - 1, 0));
        break;
    }
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        className="w-full rounded-2xl border border-border-dark bg-bg px-3 py-2.5 text-left text-sm text-text flex items-center justify-between gap-2"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate">
          {activeCharacter ? (
            <>
              <span className="font-medium">{activeCharacter.name}</span>
              <span className="ml-1.5 text-text-muted">
                {formatClassDisplayString(activeCharacter.classes)}
              </span>
            </>
          ) : (
            <span className="text-text-muted">No character</span>
          )}
        </span>
        <span className="text-text-dim shrink-0" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 z-50 rounded-2xl border border-border-dark bg-bg-1 overflow-hidden shadow-panel max-h-[320px] overflow-y-auto"
        >
          {characters.map((character, index) => {
            const isActive = character.id === activeCharacterId;
            const isFocused = focusedIndex === index;
            return (
              <div
                key={character.id}
                role="option"
                aria-selected={isActive}
                tabIndex={isFocused ? 0 : -1}
                className={[
                  'px-3 py-2.5 cursor-pointer',
                  isActive
                    ? 'border-l-2 border-gold-soft bg-gold-soft/12'
                    : 'hover:bg-bg-2',
                  isFocused ? 'outline-none ring-1 ring-inset ring-gold-soft' : '',
                ].join(' ')}
                onClick={() => {
                  onSelectCharacter(character.id);
                  setOpen(false);
                }}
                onKeyDown={(e) => handleItemKeyDown(e, index)}
              >
                <div className="text-sm font-semibold text-text leading-tight">
                  {character.name}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {formatClassDisplayString(character.classes)}
                </div>
              </div>
            );
          })}

          <div
            role="option"
            aria-selected={false}
            tabIndex={focusedIndex === characters.length ? 0 : -1}
            className={[
              'px-3 py-2.5 border-t border-border-dark cursor-pointer hover:bg-bg-2',
              focusedIndex === characters.length
                ? 'outline-none ring-1 ring-inset ring-gold-soft'
                : '',
            ].join(' ')}
            onClick={() => {
              onCreateNew();
              setOpen(false);
            }}
            onKeyDown={(e) => handleItemKeyDown(e, characters.length)}
          >
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-gold-soft">
              + New Character
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
