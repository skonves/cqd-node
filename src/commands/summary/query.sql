select c.hash, c.date, c.message, sum(ch.lines), sum(ch.blank_lines), sum(ch.total_ind), max(ch.max_ind) from commits c
join (
	select ch.id change_id, c1.date start, c2.date end from changes ch
	Join file_names n on ch.file_name_id = n.id AND n.name <> 'package-lock.json'
	join commits c1 on ch.hash = c1.hash
	left join commits c2 on ch.until_hash = c2.hash
) x on c.date >= x.start AND (x.end IS NULL OR c.date < x.end)
JOIN changes ch on x.change_id = ch.id

group by c.hash, c.date, c.message

order by c.date desc
