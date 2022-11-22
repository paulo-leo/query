class Query {

    constructor(url='')
    {
      this.url = url;
      this.datax = [];
      this.results = [];
      this.limitx = 0;
      this.fields = '*';
      this.filters = false;
      this.funcs = {};
      this.$as = {};
      this.orderName = false;
      this.orderType = false;
      this.orderTypeContent = 0;
      this.colection = 't';
      this.colections = [];
      this.ons = [];
      this.joins = {};
    }

    orderBy(name,type=false)
    {
       this.orderName = name;
       this.orderType = type;
       return this;
    }

    where(call)
    {
       this.filters = call;
       return this;
    };

    checkFilter()
    {
       return (typeof this.filters == 'function') ? true : false;
    }

    executeFilter(val)
    {
        return this.filters(val);
    }

     case(key,call)
     {
        this.funcs[key] = call;
        return this;
     };

     executeSetFun(key,val)
     {
        if(this.funcs.hasOwnProperty(key))
        {
            val = this.funcs[key](val);
        }
        return val;
     }

     deleteIndex(datax,deletes)
     {
        let only = [];
        let index = 0;
        for(let i = 0; i < datax.length; i++)
        {
            if(!deletes.includes(i))
            {
                only[index] = datax[i];
                index++;
            }
        }
        return only;
     }
   
    as(key, keyNew)
    {
       this.$as[key] = keyNew;
       return this;
    }

    executeAs(arr)
    {
      for(let i = 0; i < arr.length; i++)
      {
         for(let key in arr[i])
         {
            if(this.$as.hasOwnProperty(key))
            {
               if(typeof this.$as[key] == 'function')
               {
                  arr[i][key] = this.$as[key](arr[i],this.colections,i);
               }
               else{
                  arr[i][this.$as[key]] = arr[i][key];
                  delete(arr[i][key]);
               }
            }
         }
      }
      return arr;
    }

    join(table,colections)
    {
      colections = (typeof colections == 'string') ? [colections] : colections;
      this.joins['table'] = table;
      this.joins['colections'] = colections;
      return this;
    }
    
    executeJoin(datas)
    {
       let table = this.joins['table'];
       let colections = this.joins['colections'];

        if(table != undefined && colections != undefined)
        {
        table = table.split('.');
        let pk = table[1];
        table = table[0];
        let arr = [];

        let pks = [];
        let fkTable = datas;

        for(let i = 0; i < fkTable.length; i++)
        {
           pks[i] = fkTable[i][pk];
        }
     
        for(let c = 0; c < colections.length; c++)
        {
           let table = colections[c].split('.');
           let fk = table[1];
           table = table[0]; 
           
           arr[table] = [];
           let content = [];
           let index = 0;
           for(let i = 0; i < this.collections(table).length; i++)
           {
              if(pks.includes(this.collections(table)[i][fk]))
              {
                content[index] = this.collections(table)[i];
                index++;
              }
           }
           this.ons[table] = content;
        }
      }
     }

    searchDataArray(fields)
    {
         let arr = [];
         let arrIndexDeletes = [];
         for(let i = 0; i < this.datax.length; i++)
         {
            arr[i] = {};

            for(let f = 0; f < fields.length; f++)
            {
                 let k = fields[f]
                 let v = this.datax[i][k];
                 if(this.checkFilter())
                 {
                    if(this.executeFilter(this.datax[i]))
                    {
                        arr[i][k] = this.executeSetFun(k,v);
                    }else arrIndexDeletes[i] = i;
                 }else
                 {
                    arr[i][k] = this.executeSetFun(k,v);
                 }
             }
         }
         
         arr = this.deleteIndex(arr,arrIndexDeletes);
         arr = this.limitReturn(arr);
         return this.executeAs(arr);
    }
   
    limitReturn(r)
    {
       let arr = [];
       if(this.limitx != 0)
       {
        let c = r.length > this.limitx ? this.limitx : r.length;
        for(let i =0; i < c; i++)
        {
           arr[i] = r[i];
        }
       }else arr = r;
      
      return arr;
    }


   setCollectionsKeys(collection,name)
   { 
      for(let i = 0; i < collection.length; i++)
      {
        for(let key in collection[i])
        {
           collection[i][name+'_'+key] = collection[i][key];
           delete(collection[i][key]);
        }
      }
      return collection;
   }

   collections(index=false)
   {
      return index ? this.colections[index] : this.colections;
   }

   joinKeys(keys1,keys2,prefix=false)
   {
      if(prefix) prefix = `${prefix}_`;
      for(let i =0; i < keys2.length; i++)
      {
         let name = `${prefix}${keys2[i]}`;
         keys1[name] = name;
      }
      return keys1;
   }

   addPrefix(name,prefix)
   {
      return `${prefix}_${name}`; 
   }

   merge(tables)
   {
      let arr = [];
      let keys = [];
      let size = 0;
      let collections = this.collections();

      for(let t = 0; t < tables.length; t++)
      {
         let colection = collections[tables[t]];
         keys = this.joinKeys(keys,Object.keys(colection[0]),tables[t]);
         size += colection.length;
      }
  
      for(let index = 0; index < size; index++)
      {
         arr[index] = {};
         for(let k in keys)
         {
            arr[index][k] = undefined;
         }
       }

         var indexCol = 0;
         for(let t = 0; t < tables.length; t++)
         {
            let table = tables[t];
          
            let indexArray = 0;   
            while(indexArray < this.collections(table).length)
            {
               for(let key in this.collections(table)[indexArray])
               {
                  arr[indexCol][this.addPrefix(key,table)] = this.collections(table)[indexArray][key];
               }
               indexCol++;
               indexArray++;
            }
            indexArray = 0;
         }

      this.data(arr);
      return this;
   }

    data(datax,table=false)
    {
       this.datax = datax;
       
       if(table)
       {
         this.colection = table;
         this.colections[this.colection] = this.datax;
       }
       this.mounted()
       return this;
    }

    limit(limitx)
    {
        this.limitx = limitx;
        return this;
    }

    select(fields='*')
    {
       fields = (typeof fields == 'string' && fields != '*') ? fields.split(',') : fields;

        if(typeof fields == 'object')
        {
          let keys = [];
          for(let i =0;i < fields.length; i++)
          {
              let key = fields[i].trim();
              let part = key.split(' as ');
              key = part[0];
              let name = part[1] != undefined ? part[1] : false;
              if(name)
              {
                 this.as(key,name);
              }
              keys[i] = key;
          }
          fields = keys;
        }

        this.fields = fields;

        return this;
    }

    getKeys()
    {
       let keys = [];
       let index = 0;
       for(let i = 0; i < this.datax.length; i++)
       {
         for(let k in this.datax[i])
         {
            if(!keys.includes(k))
            {
                keys[index] = k;
                index++;
            }
         }
       }
       return keys;
    }

    mounted()
    {
      if(this.fields == '*')
      {
        this.select(this.getKeys());
      }

      if(!Array.isArray(this.datax)) this.setData([this.datax]);
      this.results = this.searchDataArray(this.fields);
    }

    get(field=false)
    {
      this.mounted();
      if(this.orderName)
      {
         let orderByName = this.orderName;
         let orderByType = this.orderType;

         this.results.sort(function(x, y,i=orderByName,t=orderByType)
         {
            if(typeof x[i] == 'number')
            {
               return t ? y[i] - x[i] : x[i] - y[i];
            }
         });

         this.results.sort(function(x, y,i=orderByName,t=orderByType)
         {
            if(typeof x[i] == 'string')
            {
              let a = x[i].toUpperCase();
              let b = y[i].toUpperCase();
              if(t) return a == b ? 0 : b > a ? 1 : - 1;
              else return a == b ? 0 : a > b ? 1 : - 1; 
            }
         });
      }

      this.executeJoin(this.results);

      for(let key in this.ons)
      {
        this.results[key] = this.ons[key];
      }
      
      if(field){
         let arr = [];
         field = field.split('.');
         let table = false;
         if(field.length == 2){ table = field[0]; field = field[1]; }
         else{ field = field[0]; }

         if(!table)
         {
            for(let i = 0; i < this.results.length; i++)
            {  
               if(this.results[i][field] != undefined)
                  arr[i] = this.results[i][field];
            }
         }else
         {
            for(let i = 0; i < this.results[table].length; i++)
            {  
               arr[i] = this.results[table][i][field];
            }  
         }

         if(arr.length == 0)
         {
            if(this.results[field] != undefined)
            {
               arr = this.results[field];
            }
         }

         return arr;

      }else{
        return this.results;
      }
    }

    getSum(key)
    {
       let datax = this.get(key);
       let calc = 0;
       for(let i = 0; i < datax.length; i++)
       {
           calc += parseFloat(datax[i]);
       } 
       return calc;
    }

    getMax(key)
    {
       let datax = this.get(key);
       return Math.max.apply(Math, datax);
    }

    getMin(key)
    {
       let datax = this.get(key);
       return Math.min.apply(Math, datax);
    }

    getCount(key)
    {
       let datax = this.get(key);
       return datax.length;
    }

    getAvg(key,fixed=2)
    {
       let total = this.getSum(key);
       let count = this.getCount(key);
       return (total / count).toFixed(fixed);
    }
}
