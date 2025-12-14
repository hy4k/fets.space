import { supabase } from './supabaseClient';
import { Project } from '../types';

// Map DB snake_case to App camelCase with robust null checking
const mapToApp = (data: any): Project => {
    if (!data) throw new Error("Received invalid project data");

    // Handle created_at safely
    let createdAt = Date.now();
    if (data.created_at) {
        const num = Number(data.created_at);
        if (!isNaN(num)) {
            createdAt = num;
        } else {
            // Fallback for string dates if schema changes
            createdAt = new Date(data.created_at).getTime();
        }
    }

    return {
        id: String(data.id),
        name: data.name || 'Untitled Project',
        description: data.description || '',
        status: data.status || 'Concept Phase',
        websiteUrl: data.website_url || '',
        repoUrl: data.repo_url || '',
        imageUrl: data.image_url || '',
        techStack: Array.isArray(data.tech_stack) ? data.tech_stack : [],
        files: data.files || '',
        itemType: data.item_type || 'app',
        createdAt: createdAt,
        changeHistory: Array.isArray(data.change_history) ? data.change_history : [],
        gitState: data.git_state || undefined
    };
};

// Map App camelCase to DB snake_case
const mapToDb = (project: Project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    website_url: project.websiteUrl,
    repo_url: project.repoUrl,
    image_url: project.imageUrl,
    tech_stack: project.techStack,
    files: project.files,
    item_type: project.itemType,
    created_at: project.createdAt,
    change_history: project.changeHistory,
    git_state: project.gitState
});

export const fetchProjects = async (): Promise<Project[]> => {
    try {
        // Add a timeout to prevent hanging on network issues (e.g. Mixed Content blocking)
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timed out')), 3000)
        );

        const fetchPromise = supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        // Race the fetch against the timeout
        // @ts-ignore
        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
            
        if (error) {
            // Convert PostgrestError to standard Error to trigger catch block
            throw new Error(error.message || 'Database error');
        }
        
        return (data || []).map(mapToApp);
    } catch (err: any) {
        // Differentiate between application errors and connection errors
        // "Failed to fetch" is the standard browser error for network issues (including Mixed Content)
        const isConnectionError = 
            err.message?.includes('Failed to fetch') || 
            err.message?.includes('Network request failed') ||
            err.message?.includes('timed out');

        if (isConnectionError) {
             console.warn("Supabase connection failed (Switching to Offline Mode):", err.message);
        } else {
             // Only log actual logic errors as errors
             console.warn("Data fetch warning:", err.message);
        }
        // Propagate to App.tsx to trigger offline mode fallback
        throw err;
    }
};

export const createProject = async (project: Project) => {
    try {
        const { error } = await supabase.from('projects').insert(mapToDb(project));
        if (error) throw error;
        return project;
    } catch (error) {
        console.error("Error creating project:", error);
        throw error;
    }
};

export const updateProject = async (project: Project) => {
    try {
        const { error } = await supabase.from('projects').update(mapToDb(project)).eq('id', project.id);
        if (error) throw error;
        return project;
    } catch (error) {
        console.error("Error updating project:", error);
        throw error;
    }
};

export const deleteProject = async (id: string) => {
    try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
    } catch (error) {
        console.error("Error deleting project:", error);
        throw error;
    }
};

export const seedInitialProjects = async (projects: Project[]) => {
    try {
        const { count, error } = await supabase.from('projects').select('*', { count: 'exact', head: true });
        if (error) throw error;

        if (count === 0) {
            const dbProjects = projects.map(mapToDb);
            const { error: insertError } = await supabase.from('projects').insert(dbProjects);
            if (insertError) {
                 console.error("Error seeding data:", insertError);
                 return false;
            }
            return true;
        }
    } catch (e) {
        console.error("Seeding failed:", e);
    }
    return false;
};