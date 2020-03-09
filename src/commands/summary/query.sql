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


SELECT
  c.hash,
  c.date,
  c.message,
  sum(ch.lines) lines,
  sum(ch.blank_lines) blank_lines,
  sum(ch.total_ind) total_ind,
  max(ch.max_ind) max_ind
FROM commits c
JOIN changes ch ON c.date >= ch.date AND (ch.until_date IS NULL OR c.date < ch.until_date)

WHERE c.date > CAST('2018-09-22' AS INT) * 1000

GROUP BY c.hash, c.date, c.message

ORDER BY c.date DESC




select sum(additions), sum(deletions), sum(lines), sum(blank_lines) from changes ch

where
	(ch.until_date IS NULL OR ch.until_date > CAST(strftime('%s', '2018-08-01') AS INT) * 1000)
	AND ch.date <= CAST(strftime('%s', '2018-08-01') AS INT) * 1000


SELECT
  c.hash,
  max(c.message) message,
  sum(ch.lines) lines,
  sum(ch.blank_lines) blank_lines,
  sum(ch.total_ind) total_ind
FROM commits c
JOIN changes ch
  ON c.date BETWEEN 1533081600000 AND 1535760000000
  AND (ch.until_date IS NULL OR ch.until_date > c.date)
  AND ch.date <= c.date

GROUP BY c.hash


--------------------

select
	hash,
	datetime(max(date)/1000, 'unixepoch', 'localtime') date,
	count(hash) files_changed,
	sum(lines_add) lines_add,
	-sum(lines_rem) lines_rem,
	--sum(lines_net) lines_net,
	sum(blank_add) blank_add,
	-sum(blank_rem) blank_rem,
	--sum(blank_net) blank_net,
	sum(total_cmplx_add) total_cmplx_add,
	-sum(total_cmplx_rem) total_cmplx_rem,
	--sum(total_cmplx_net) total_cmplx_net,
	sum(mean_cmplx_add) mean_cmplx_add,
	-sum(mean_cmplx_rem) mean_cmplx_rem,
	--sum(mean_cmplx_net) mean_cmplx_net,
	sum(sd_cmplx_add) sd_cmplx_add,
	-sum(sd_cmplx_rem) sd_cmplx_rem,
	--sum(sd_cmplx_net) sd_cmplx_net,
	sum(max_cmplx_add) max_cmplx_add,
	-sum(max_cmplx_rem) max_cmplx_rem
	--sum(max_cmplx_net) max_cmplx_net
from (select
	cur.id,
	cur.hash,
	cur.date,
	cur.file_id,
	cur.file_name_id,
	cur.change,
	
	cur.additions lines_add,
	cur.deletions lines_rem,
	cur.lines lines_net,
	
	CASE WHEN cur.blank_lines > IFNULL(prev.blank_lines,0) then cur.blank_lines - IFNULL(prev.blank_lines,0) ELSE 0 END blank_add,
	CASE WHEN cur.blank_lines < IFNULL(prev.blank_lines,0) then - cur.blank_lines + IFNULL(prev.blank_lines,0) ELSE 0 END blank_rem,	
	cur.blank_lines blank_net,
	
	CASE WHEN cur.total_ind > IFNULL(prev.total_ind,0) then cur.total_ind - IFNULL(prev.total_ind,0) ELSE 0 END total_cmplx_add,
	CASE WHEN cur.total_ind < IFNULL(prev.total_ind,0) then - cur.total_ind + IFNULL(prev.total_ind,0) ELSE 0 END total_cmplx_rem,
	cur.total_ind total_cmplx_net,
	
	CASE WHEN cur.mean_ind > IFNULL(prev.mean_ind,0) then cur.mean_ind - IFNULL(prev.mean_ind,0) ELSE 0 END mean_cmplx_add,
	CASE WHEN cur.mean_ind < IFNULL(prev.mean_ind,0) then - cur.mean_ind + IFNULL(prev.mean_ind,0) ELSE 0 END mean_cmplx_rem,
	cur.mean_ind mean_cmplx_net,
	
	CASE WHEN cur.sd_ind > IFNULL(prev.sd_ind,0) then cur.sd_ind - IFNULL(prev.sd_ind,0) ELSE 0 END sd_cmplx_add,
	CASE WHEN cur.sd_ind < IFNULL(prev.sd_ind,0) then - cur.sd_ind + IFNULL(prev.sd_ind,0) ELSE 0 END sd_cmplx_rem,
	cur.sd_ind sd_cmplx_net,
	
	CASE WHEN cur.max_ind > IFNULL(prev.max_ind,0) then cur.max_ind - IFNULL(prev.max_ind,0) ELSE 0 END max_cmplx_add,
	CASE WHEN cur.max_ind < IFNULL(prev.max_ind,0) then - cur.max_ind + IFNULL(prev.max_ind,0) ELSE 0 END max_cmplx_rem,
	cur.max_ind max_cmplx_net
 from changes cur

LEFT JOIN changes prev on prev.until_hash = cur.hash and prev.file_id = cur.file_id) as x

group by x.hash

order by date asc

