import { makeLegalPage } from '../../../components/legal/legal-article';

const { generateMetadata, Page } = makeLegalPage('privacy-policy', 'privacy');
export { generateMetadata };
export default Page;
