export type ContentType = 'movie' | 'series' | 'anime';
export type Mood = 'Chill' | 'Excited' | 'Emotional' | 'Laugh' | 'Scared' | 'Mind-bending';
export type Language = 'English' | 'Hindi' | 'Japanese' | 'Spanish' | 'Korean' | 'French' | 'German' | 'Italian' | 'Chinese' | 'Portuguese' | 'Russian' | 'Arabic';

export interface ContentItem {
    id: string;
    title: string;
    type: ContentType;
    moods: Mood[];
    genres: string[];
    language: Language;
    rating: number;
    year: number;
    image: string; // Poster/Backdrop URL
    description: string;
    trailerUrl?: string; // Legacy full URL (optional)
    trailerKey?: string; // YouTube Video ID (e.g., "dQw4w9WgXcQ")
    watchProviders?: {
        name: string;
        logo: string;
        link: string;
    }[];
}

export const db: ContentItem[] = [
    // ==================== ANIME (Global & Crunchyroll Hits) ====================
    { id: 'a1', title: 'Your Name', type: 'anime', moods: ['Emotional', 'Mind-bending', 'Chill'], genres: ['Romance', 'Fantasy'], language: 'Japanese', rating: 9.2, year: 2016, image: 'https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=2000', description: "Two strangers find themselves linked in a bizarre way." },
    { id: 'a2', title: 'Jujutsu Kaisen', type: 'anime', moods: ['Excited', 'Scared'], genres: ['Action', 'Supernatural'], language: 'Japanese', rating: 8.8, year: 2020, image: 'https://images.unsplash.com/photo-1630713815164-8c8d2347963d?q=80&w=2000', description: "A boy swallows a cursed talisman and becomes cursed himself." },
    { id: 'a3', title: 'Spy x Family', type: 'anime', moods: ['Laugh', 'Chill', 'Excited'], genres: ['Action', 'Comedy'], language: 'Japanese', rating: 8.5, year: 2022, image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2000', description: "A spy, an assignee, and a telepath form a makeshift family." },
    { id: 'a4', title: 'Demon Slayer', type: 'anime', moods: ['Excited', 'Emotional'], genres: ['Action', 'Fantasy'], language: 'Japanese', rating: 8.9, year: 2019, image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=2000', description: "Tanjiro sets out to become a demon slayer to avenge his family." },
    { id: 'a5', title: 'Attack on Titan', type: 'anime', moods: ['Scared', 'Excited', 'Mind-bending'], genres: ['Action', 'Dark Fantasy'], language: 'Japanese', rating: 9.1, year: 2013, image: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=2000', description: "Humanity fights for survival against man-eating giants." },
    { id: 'a6', title: 'Death Note', type: 'anime', moods: ['Mind-bending', 'Scared'], genres: ['Thriller'], language: 'Japanese', rating: 9.0, year: 2006, image: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=2000', description: "A high school student discovers a supernatural notebook that kills." },
    { id: 'a7', title: 'One Piece', type: 'anime', moods: ['Excited', 'Laugh', 'Emotional'], genres: ['Adventure'], language: 'Japanese', rating: 8.9, year: 1999, image: 'https://images.unsplash.com/photo-1563482776068-4dac10f9373d?q=80&w=2000', description: "Monkey D. Luffy explores the world in search of the ultimate treasure." },
    { id: 'a8', title: 'Naruto Shippuden', type: 'anime', moods: ['Excited', 'Emotional'], genres: ['Action'], language: 'Japanese', rating: 8.7, year: 2007, image: 'https://wallpaperaccess.com/full/134446.jpg', description: "Naruto Uzumaki searches for approval and the Hokage title." },
    { id: 'a9', title: 'Fullmetal Alchemist: Brotherhood', type: 'anime', moods: ['Emotional', 'Excited'], genres: ['Adventure'], language: 'Japanese', rating: 9.1, year: 2009, image: 'https://wallpaperaccess.com/full/767175.jpg', description: "Two brothers search for a Philosopher's Stone." },
    { id: 'a10', title: 'One Punch Man', type: 'anime', moods: ['Laugh', 'Excited'], genres: ['Action', 'Comedy'], language: 'Japanese', rating: 8.7, year: 2015, image: 'https://wallpaperaccess.com/full/1126752.jpg', description: "A hero who can defeat any opponent with a single punch." },
    { id: 'a11', title: 'Bleach', type: 'anime', moods: ['Excited', 'Scared'], genres: ['Action', 'Supernatural'], language: 'Japanese', rating: 8.2, year: 2004, image: 'https://wallpaperaccess.com/full/226598.jpg', description: "Ichigo Kurosaki gains the powers of a Soul Reaper." },
    { id: 'a12', title: 'Hunter x Hunter', type: 'anime', moods: ['Excited', 'Mind-bending'], genres: ['Adventure'], language: 'Japanese', rating: 9.0, year: 2011, image: 'https://wallpaperaccess.com/full/180598.jpg', description: "Gon Freecss aspires to become a Hunter and find his father." },
    { id: 'a13', title: 'Cowboy Bebop', type: 'anime', moods: ['Chill', 'Mind-bending'], genres: ['Sci-Fi', 'Action'], language: 'Japanese', rating: 8.9, year: 1998, image: 'https://wallpaperaccess.com/full/1449179.jpg', description: "A ragtag crew of bounty hunters chases criminals across the galaxy." },
    { id: 'a14', title: 'My Hero Academia', type: 'anime', moods: ['Excited', 'Laugh'], genres: ['Action', 'Supernatural'], language: 'Japanese', rating: 8.3, year: 2016, image: 'https://wallpaperaccess.com/full/428387.jpg', description: "A boy born without superpowers enrolls in a prestigious hero academy." },
    { id: 'a15', title: 'Neon Genesis Evangelion', type: 'anime', moods: ['Mind-bending', 'Scared', 'Emotional'], genres: ['Sci-Fi', 'Psychological'], language: 'Japanese', rating: 8.5, year: 1995, image: 'https://wallpaperaccess.com/full/2040182.jpg', description: "Teenagers pilot giant mechs to protect humanity from Angels." },

    // ==================== MOVIES (Hollywood Blockbusters) ====================
    { id: 'm1', title: 'Inception', type: 'movie', moods: ['Mind-bending', 'Excited'], genres: ['Sci-Fi'], language: 'English', rating: 9.3, year: 2010, image: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2000', description: "Dream thieves." },
    { id: 'm2', title: 'The Dark Knight', type: 'movie', moods: ['Excited', 'Mind-bending'], genres: ['Action'], language: 'English', rating: 9.8, year: 2008, image: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cd4?q=80&w=2000', description: "Batman vs Joker." },
    { id: 'm3', title: 'Interstellar', type: 'movie', moods: ['Mind-bending', 'Emotional'], genres: ['Sci-Fi'], language: 'English', rating: 9.2, year: 2014, image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000', description: "Space travel to save Earth." },
    { id: 'm4', title: 'Avengers: Endgame', type: 'movie', moods: ['Excited', 'Emotional'], genres: ['Action'], language: 'English', rating: 8.4, year: 2019, image: 'https://wallpaperaccess.com/full/1345265.jpg', description: "The Avengers assemble one last time." },
    { id: 'm5', title: 'Spider-Man: Across the Spider-Verse', type: 'movie', moods: ['Excited', 'Mind-bending'], genres: ['Animation'], language: 'English', rating: 8.7, year: 2023, image: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=2000', description: "Miles Morales catapults across the Multiverse." },
    { id: 'm6', title: 'Oppenheimer', type: 'movie', moods: ['Mind-bending', 'Scared'], genres: ['Biography', 'Drama'], language: 'English', rating: 8.5, year: 2023, image: 'https://wallpaperaccess.com/full/10710606.jpg', description: "The story of American scientist J. Robert Oppenheimer." },
    { id: 'm7', title: 'Barbie', type: 'movie', moods: ['Laugh', 'Chill'], genres: ['Comedy'], language: 'English', rating: 7.0, year: 2023, image: 'https://images.unsplash.com/photo-1596525737279-0523bb80ce35?q=80&w=2000', description: "Barbie suffers a crisis that leads her to question her world." },
    { id: 'm8', title: 'John Wick 4', type: 'movie', moods: ['Excited'], genres: ['Action'], language: 'English', rating: 7.8, year: 2023, image: 'https://wallpaperaccess.com/full/8844111.jpg', description: "John Wick uncovers a path to defeating The High Table." },
    { id: 'm9', title: 'Top Gun: Maverick', type: 'movie', moods: ['Excited', 'Emotional'], genres: ['Action'], language: 'English', rating: 8.3, year: 2022, image: 'https://wallpaperaccess.com/full/8028741.jpg', description: "Maverick returns to train a new generation of pilots." },
    { id: 'm10', title: 'The Matrix', type: 'movie', moods: ['Mind-bending', 'Excited'], genres: ['Sci-Fi'], language: 'English', rating: 8.7, year: 1999, image: 'https://wallpaperaccess.com/full/279895.jpg', description: "A computer hacker learns the truth about his reality." },

    // --- Bollywood / Regional Hits ---
    { id: 'm11', title: '3 Idiots', type: 'movie', moods: ['Laugh', 'Emotional'], genres: ['Comedy', 'Drama'], language: 'Hindi', rating: 9.5, year: 2009, image: 'https://wallpaperaccess.com/full/2261765.jpg', description: "All is well." },
    { id: 'm12', title: 'Dangal', type: 'movie', moods: ['Emotional', 'Excited'], genres: ['Biography', 'Sports'], language: 'Hindi', rating: 8.3, year: 2016, image: 'https://wallpaperaccess.com/full/1569720.jpg', description: "Wrestling biopic." },
    { id: 'm13', title: 'RRR', type: 'movie', moods: ['Excited', 'Emotional'], genres: ['Action'], language: 'Hindi', rating: 8.8, year: 2022, image: 'https://images.unsplash.com/photo-1623919420556-3c2242197471?q=80&w=2000', description: "Revolutionary bromance." },
    { id: 'm14', title: 'Sholay', type: 'movie', moods: ['Excited', 'Laugh'], genres: ['Action'], language: 'Hindi', rating: 9.3, year: 1975, image: 'https://images.unsplash.com/photo-1563198804-b144dfc80be0?q=80&w=2000', description: "Classic western." },
    { id: 'm15', title: 'Gully Boy', type: 'movie', moods: ['Emotional', 'Excited'], genres: ['Drama', 'Music'], language: 'Hindi', rating: 8.0, year: 2019, image: 'https://wallpaperaccess.com/full/1922987.jpg', description: "A coming-of-age story based on the lives of street rappers in Mumbai." },
    { id: 'm16', title: 'Train to Busan', type: 'movie', moods: ['Scared', 'Emotional', 'Excited'], genres: ['Horror', 'Action'], language: 'Korean', rating: 7.6, year: 2016, image: 'https://wallpaperaccess.com/full/1098463.jpg', description: "Zombies on a train." },
    { id: 'm17', title: 'Amélie', type: 'movie', moods: ['Chill', 'Laugh'], genres: ['Romance', 'Comedy'], language: 'French', rating: 8.3, year: 2001, image: 'https://wallpaperaccess.com/full/1539281.jpg', description: "An innocent and naive girl in Paris." },

    // ==================== SERIES (Netflix / Disney+ / Prime) ====================
    // Netflix
    { id: 's1', title: 'Stranger Things', type: 'series', moods: ['Scared', 'Excited'], genres: ['Sci-Fi'], language: 'English', rating: 8.7, year: 2016, image: 'https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=2000', description: "Hawkins, Indiana." },
    { id: 's2', title: 'The Crown', type: 'series', moods: ['Chill', 'Emotional'], genres: ['Drama', 'History'], language: 'English', rating: 8.6, year: 2016, image: 'https://wallpaperaccess.com/full/2265261.jpg', description: "Follows the political rivalries and romance of Queen Elizabeth II's reign." },
    { id: 's3', title: 'Black Mirror', type: 'series', moods: ['Mind-bending', 'Scared'], genres: ['Sci-Fi', 'Anthology'], language: 'English', rating: 8.8, year: 2011, image: 'https://wallpaperaccess.com/full/1264627.jpg', description: "An anthology series exploring a twisted, high-tech multiverse." },
    { id: 's4', title: 'Money Heist', type: 'series', moods: ['Excited'], genres: ['Crime'], language: 'Spanish', rating: 8.6, year: 2017, image: 'https://images.unsplash.com/photo-1550100136-e074fa43d818?q=80&w=2000', description: "La Casa de Papel." },
    { id: 's5', title: 'Squid Game', type: 'series', moods: ['Scared', 'Excited'], genres: ['Thriller'], language: 'Korean', rating: 8.3, year: 2021, image: 'https://images.unsplash.com/photo-1632296434442-9993358327d5?q=80&w=2000', description: "Deadly kids games." },
    { id: 's6', title: 'Wednesday', type: 'series', moods: ['Laugh', 'Scared'], genres: ['Fantasy', 'Comedy'], language: 'English', rating: 8.1, year: 2022, image: 'https://wallpaperaccess.com/full/8288591.jpg', description: "Follows Wednesday Addams' years as a student." },
    { id: 's7', title: 'Reacher', type: 'series', moods: ['Excited'], genres: ['Action'], language: 'English', rating: 8.1, year: 2022, image: 'https://wallpaperaccess.com/full/8028741.jpg', description: "Jack Reacher was arrested for murder and now has to prove his innocence." },
    { id: 's8', title: 'The Witcher', type: 'series', moods: ['Excited', 'Mind-bending'], genres: ['Action', 'Fantasy'], language: 'English', rating: 8.0, year: 2019, image: 'https://wallpaperaccess.com/full/1569720.jpg', description: "Geralt of Rivia, a solitary monster hunter." },

    // Disney+ / HBO
    { id: 's9', title: 'The Mandalorian', type: 'series', moods: ['Excited', 'Chill'], genres: ['Sci-Fi'], language: 'English', rating: 8.7, year: 2019, image: 'https://wallpaperaccess.com/full/2261765.jpg', description: "Star Wars series." },
    { id: 's10', title: 'Loki', type: 'series', moods: ['Mind-bending', 'Laugh'], genres: ['Sci-Fi', 'Fantasy'], language: 'English', rating: 8.2, year: 2021, image: 'https://wallpaperaccess.com/full/6265005.jpg', description: "The mercurial villain Loki resumes his role as the God of Mischief." },
    { id: 's11', title: 'Game of Thrones', type: 'series', moods: ['Excited', 'Scared'], genres: ['Fantasy'], language: 'English', rating: 9.2, year: 2011, image: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?q=80&w=2000', description: "Winter is coming." },
    { id: 's12', title: 'The Last of Us', type: 'series', moods: ['Scared', 'Emotional'], genres: ['Drama', 'Horror'], language: 'English', rating: 8.8, year: 2023, image: 'https://wallpaperaccess.com/full/9628038.jpg', description: "A hardened survivor takes charge of a 14-year-old girl." },
    { id: 's13', title: 'Chernobyl', type: 'series', moods: ['Scared', 'Emotional'], genres: ['History', 'Drama'], language: 'English', rating: 9.4, year: 2019, image: 'https://wallpaperaccess.com/full/134446.jpg', description: "Dramatization of the true story of the Chernobyl nuclear catastrophe." },

    // Comedy / Sitcoms
    { id: 's14', title: 'Friends', type: 'series', moods: ['Laugh', 'Chill'], genres: ['Comedy'], language: 'English', rating: 8.9, year: 1994, image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2000', description: "PIVOT!" },
    { id: 's15', title: 'The Office', type: 'series', moods: ['Laugh', 'Chill'], genres: ['Comedy'], language: 'English', rating: 9.0, year: 2005, image: 'https://images.unsplash.com/photo-1528605205643-2642a47dd54e?q=80&w=2000', description: "Bears, Beets, Battlestar Galactica." },
    { id: 's16', title: 'Brooklyn Nine-Nine', type: 'series', moods: ['Laugh', 'Excited'], genres: ['Comedy', 'Crime'], language: 'English', rating: 8.4, year: 2013, image: 'https://wallpaperaccess.com/full/1126752.jpg', description: "Comedy series following the exploits of Det. Jake Peralta." },
    { id: 's17', title: 'Ted Lasso', type: 'series', moods: ['Laugh', 'Emotional', 'Chill'], genres: ['Comedy', 'Sports'], language: 'English', rating: 8.8, year: 2020, image: 'https://wallpaperaccess.com/full/5747372.jpg', description: "American college football coach Ted Lasso heads to London." },

    // Indian Series
    { id: 's18', title: 'Sacred Games', type: 'series', moods: ['Excited', 'Mind-bending'], genres: ['Crime'], language: 'Hindi', rating: 8.5, year: 2018, image: 'https://images.unsplash.com/photo-1560169878-a2891d77186d?q=80&w=2000', description: "Mumbai gangster saga." },
    { id: 's19', title: 'Mirzapur', type: 'series', moods: ['Excited', 'Scared'], genres: ['Crime'], language: 'Hindi', rating: 8.5, year: 2018, image: 'https://images.unsplash.com/photo-1614136209598-f584f23b7b6c?q=80&w=2000', description: "Kaleen Bhaiya." },
    { id: 's20', title: 'The Family Man', type: 'series', moods: ['Excited', 'Laugh'], genres: ['Action', 'Comedy'], language: 'Hindi', rating: 8.8, year: 2019, image: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=2000', description: "Spy life balance." },
    { id: 's21', title: 'Kota Factory', type: 'series', moods: ['Chill', 'Emotional'], genres: ['Drama'], language: 'Hindi', rating: 9.0, year: 2019, image: 'https://wallpaperaccess.com/full/2261765.jpg', description: "IIT preparation struggles." },
    { id: 's22', title: 'Panchayat', type: 'series', moods: ['Laugh', 'Chill'], genres: ['Comedy'], language: 'Hindi', rating: 8.9, year: 2020, image: 'https://wallpaperaccess.com/full/1569720.jpg', description: "Village Politics." },
    { id: 's23', title: 'Scam 1992', type: 'series', moods: ['Mind-bending', 'Excited'], genres: ['Biography', 'Crime'], language: 'Hindi', rating: 9.3, year: 2020, image: 'https://wallpaperaccess.com/full/2666578.jpg', description: "The rise and fall of Harshad Mehta." }
];
