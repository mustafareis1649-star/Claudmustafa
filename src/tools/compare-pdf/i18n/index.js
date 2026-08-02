import en from './en.json';
import tr from './tr.json';
import es from './es.json';
import de from './de.json';
import fr from './fr.json';
import pt from './pt.json';
import ar from './ar.json';
import ru from './ru.json';
import hi from './hi.json';

// compare-pdf's own dictionary — nothing here is shared with other tools, so it
// lives with the tool, not the shell.
export const comparePdfDicts = { en, tr, es, de, fr, pt, ar, ru, hi };
